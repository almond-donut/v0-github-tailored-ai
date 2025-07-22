"use client"

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, GitBranch, Star, Users, Calendar, ChevronRight, ChevronDown, FolderIcon, FileIcon, RefreshCw, AlertCircle, Github } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Tree, TreeItem, TreeItemLabel } from '@/components/ui/tree'
import { getRepositoryService, type UserRepository } from '@/lib/repository-service'
import { getGitHubAPI } from '@/lib/github'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { UpgradePrompt } from './upgrade-prompt'

const PERSONAL_TOKEN_STORAGE_KEY = 'github_personal_token'

// This can be expanded with more details from the GitHub API response
interface Branch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

interface CompactRepositoryListProps {
  repositories: UserRepository[]
  onRepositoryClick?: (repository: UserRepository) => void
  onChange?: (repositories: UserRepository[]) => void
}

export function CompactRepositoryList({
  repositories: initialRepositories,
  onRepositoryClick,
  onChange
}: CompactRepositoryListProps) {
  const [repositories, setRepositories] = useState(initialRepositories)

  useEffect(() => {
    setRepositories(initialRepositories)
  }, [initialRepositories])
  const repositoryService = getRepositoryService()
  const [stagedChanges, setStagedChanges] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set())
  const [branches, setBranches] = useState<Record<number, Branch[]>>({})
  const [loadingBranches, setLoadingBranches] = useState<Set<number>>(new Set())
  const [branchErrors, setBranchErrors] = useState<Record<number, string | null>>({})
  const [isRefreshingAuth, setIsRefreshingAuth] = useState(false)

  const refreshAuth = async () => {
    try {
      setIsRefreshingAuth(true)
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      // Clear all branch errors and try to fetch branches again
      setBranchErrors({})
      setBranches({})
      
      // Re-fetch branches for expanded repos
      for (const repoIdStr of expandedRepos) {
        const repo = repositories.find(r => r.id.toString() === repoIdStr)
        if (repo) {
          await fetchBranches(repo)
        }
      }
    } catch (error) {
      console.error('Auth refresh failed:', error)
    } finally {
      setIsRefreshingAuth(false)
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(repositories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setRepositories(items)
    setStagedChanges(prev => [...new Set([...prev, 'Repository order changed'])])
    onChange?.(items)
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  const fetchBranches = async (repo: UserRepository, isRetry = false) => {
    if (branches[repo.id] || loadingBranches.has(repo.id)) return // Already fetched or is fetching

    // Clear previous error for this repo before fetching
    setBranchErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[repo.id];
      return newErrors;
    });

    setLoadingBranches(prev => new Set(prev).add(repo.id))
    try {
      const api = await getGitHubAPI()
      const [owner, repoName] = repo.full_name.split('/')
      const fetchedBranches = await api.getBranches(owner, repoName)
      setBranches(prev => ({ ...prev, [repo.id]: fetchedBranches }))
    } catch (error: any) {
      console.error(`Failed to fetch branches for ${repo.name}:`, error)
      
      let errorMessage = 'Failed to load branches.'
      
      // Handle specific error cases
      if (error.status === 401) {
        errorMessage = 'GitHub session expired. Click "Refresh Auth" to renew access.'
        
        // Auto-try refresh auth once if this is not already a retry
        if (!isRetry) {
          try {
            setIsRefreshingAuth(true)
            await refreshAuth()
            // Retry fetching branches after refresh
            setTimeout(() => fetchBranches(repo, true), 1000)
            return
          } catch (refreshError) {
            console.error('Auto-refresh failed:', refreshError)
          } finally {
            setIsRefreshingAuth(false)
          }
        }
      } else if (error.status === 403) {
        errorMessage = 'Repository access denied or rate limit exceeded.'
      } else if (error.status === 404) {
        errorMessage = 'Repository not found or access denied.'
      } else if (error.message?.includes('No GitHub access token')) {
        errorMessage = 'GitHub token not configured. Please set up your GitHub token in the dashboard header.'
        
        // Check if user has personal token in localStorage
        const hasPersonalToken = localStorage.getItem(PERSONAL_TOKEN_STORAGE_KEY)
        if (!hasPersonalToken) {
          errorMessage = 'GitHub authentication needed. Click the "Token setup required" button in the header to get started.'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setBranchErrors(prev => ({ ...prev, [repo.id]: errorMessage }))
    } finally {
      setLoadingBranches(prev => {
        const newSet = new Set(prev)
        newSet.delete(repo.id)
        return newSet
      })
    }
  }

  const toggleRepository = (repo: UserRepository, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const repoIdStr = repo.id.toString()
    
    const newExpandedSet = new Set(expandedRepos)
    if (newExpandedSet.has(repoIdStr)) {
      newExpandedSet.delete(repoIdStr)
    } else {
      newExpandedSet.add(repoIdStr)
      // Fetch branches if they haven't been fetched yet
      if (!branches[repo.id]) {
        fetchBranches(repo)
      }
    }
    setExpandedRepos(newExpandedSet)
    onRepositoryClick?.(repo)
  }

  const handleApplyChanges = async () => {
    setIsLoading(true)
    try {
      const repositoryIds = repositories.map(repo => repo.id)
      await repositoryService.updateRepositoryOrder(repositoryIds)
      setStagedChanges([])
    } catch (error) {
      console.error("Failed to save repository order", error)
      // Optionally, show an error to the user
    } finally {
      setIsLoading(false)
    }
  }

  const renderBranch = (branch: Branch) => (
    <div key={branch.name} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
      <GitBranch className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-sm">{branch.name}</span>
      {branch.protected && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Protected</Badge>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Tree className="space-y-1">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="repositories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {repositories.map((repo, index) => {
                  const isExpanded = expandedRepos.has(repo.id.toString())
                  const repoBranches = branches[repo.id] || []
                  const isLoadingBranches = loadingBranches.has(repo.id)
                  
                  return (
                    <div key={repo.id}>
                      <Draggable draggableId={repo.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <TreeItem level={0}>
                              <TreeItemLabel
                                className={`
                                  ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 rotate-1' : 'hover:bg-accent hover:text-accent-foreground'}
                                  transition-all duration-200
                                `}
                                onClick={(e) => toggleRepository(repo, e)}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <div
                                    {...provided.dragHandleProps}
                                    data-drag-handle="true"
                                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  
                                  <FolderIcon className="h-4 w-4 text-muted-foreground" />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm truncate">{repo.name}</span>
                                      {repo.private && (
                                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Private</Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        {repo.language}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Star className="h-3 w-3" />
                                        {repo.stargazers_count}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <GitBranch className="h-3 w-3" />
                                        {repo.forks_count}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatLastUpdated(repo.updated_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TreeItemLabel>
                            </TreeItem>
                          </div>
                        )}
                      </Draggable>
                      
                      {/* Branches - shown when expanded */}
                      {isExpanded && (
                        <div className="ml-10 pl-4 border-l border-muted-foreground/20 py-2 space-y-1">
                          {isLoadingBranches ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading branches...</span>
                            </div>
                          ) : isRefreshingAuth ? (
                            <div className="flex items-center gap-2 text-blue-600 text-sm p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Refreshing authentication...</span>
                            </div>
                          ) : branchErrors[repo.id] ? (
                            !localStorage.getItem(PERSONAL_TOKEN_STORAGE_KEY) ? (
                              <div className="px-2">
                                <UpgradePrompt 
                                  feature="branches"
                                  onUpgrade={() => {
                                    const setupButton = document.querySelector('[data-setup-token]') as HTMLButtonElement
                                    setupButton?.click()
                                  }}
                                  onDismiss={() => {
                                    setBranchErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors[repo.id]
                                      return newErrors
                                    })
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="text-amber-600 text-sm p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <AlertCircle className="h-4 w-4 text-amber-600" />
                                      <p className="font-medium">Connection Issue</p>
                                    </div>
                                    <p className="text-xs text-amber-700 mb-2">{branchErrors[repo.id]}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-6 px-2 text-xs border-amber-300 hover:bg-amber-100" 
                                    onClick={() => fetchBranches(repo)}
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry
                                  </Button>
                                  {(branchErrors[repo.id]?.includes('expired') || branchErrors[repo.id]?.includes('Refresh Auth')) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-6 px-2 text-xs border-amber-300 hover:bg-amber-100" 
                                      onClick={refreshAuth}
                                      disabled={isRefreshingAuth}
                                    >
                                      {isRefreshingAuth ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                          Refreshing...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="h-3 w-3 mr-1" />
                                          Refresh Auth
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          ) : repoBranches.length > 0 ? (
                            repoBranches.map((branch) => (
                              <TreeItem key={branch.name} level={1}>
                                {renderBranch(branch)}
                              </TreeItem>
                            ))
                          ) : (
                            <div className="text-muted-foreground text-sm p-2">No branches found.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Tree>

      {/* Apply Changes Section */}
      {stagedChanges.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Staged Changes</h4>
            <div className="space-y-1">
              {stagedChanges.map((change, index) => (
                <div key={index} className="text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                  {change}
                </div>
              ))}
            </div>
          </div>
          
          <LoadingButton
            onClick={handleApplyChanges}
            disabled={isLoading}
            data-loading={isLoading}
            className="w-full bg-white text-black hover:bg-gray-100 border border-gray-300"
          >
            Apply Changes
          </LoadingButton>
        </div>
      )}
    </div>
  )
}

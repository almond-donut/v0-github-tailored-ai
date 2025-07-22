'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Github,
  AlertCircle,
  Loader2,
  SortAsc,
  SortDesc,
  Save
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableRepositoryCard } from './sortable-repository-card'
import { getRepositoryService, type UserRepository } from '@/lib/repository-service'
import { handleGitHubAPIError } from '@/lib/github'
import { getCurrentUser, signInWithGitHub } from '@/lib/auth'

interface RepositoryListProps {
  onRepositoryAnalyze?: (repoId: number) => void
  onRepositoryToggleFeatured?: (repoId: number) => void
  onRepositoryUpdateNotes?: (repoId: number, notes: string) => void
}

export function RepositoryList({
  onRepositoryAnalyze,
  onRepositoryToggleFeatured,
  onRepositoryUpdateNotes
}: RepositoryListProps) {
  const [repositories, setRepositories] = useState<UserRepository[]>([])
  const [filteredRepositories, setFilteredRepositories] = useState<UserRepository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAutoSyncing, setIsAutoSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'stars' | 'forks' | 'priority'>('updated')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showPrivate, setShowPrivate] = useState(true)

  const repositoryService = getRepositoryService()

  const availableLanguages = useMemo(() => {
    const languages = new Set(repositories.map(repo => repo.language).filter(Boolean));
    return Array.from(languages) as string[];
  }, [repositories]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load repositories from database
  const loadRepositories = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const repos = await repositoryService.getUserRepositories({
        includePrivate: showPrivate,
        sortBy,
        sortDirection,
        filters: {
          language: languageFilter !== 'all' ? languageFilter : undefined,
          searchTerm: searchTerm || undefined
        }
      })
      
      setRepositories(repos)
      setFilteredRepositories(repos)
    } catch (err) {
      console.error('Error loading repositories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load repositories')
    } finally {
      setIsLoading(false)
    }
  }

  // Sync repositories from GitHub
  const syncRepositories = async () => {
    if (!isAuthenticated) {
      setError('Please authenticate with GitHub to sync repositories')
      return
    }

    setIsSyncing(true)
    setError(null)
    
    try {
      const repos = await repositoryService.syncRepositoriesFromGitHub()
      setRepositories(repos)
      setFilteredRepositories(repos)
    } catch (err) {
      console.error('Error syncing repositories:', err)
      setError(handleGitHubAPIError(err))
    } finally {
      setIsSyncing(false)
    }
  }

  // Filter repositories based on current filters
  useEffect(() => {
    let filtered = [...repositories]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(searchLower) ||
        repo.description?.toLowerCase().includes(searchLower) ||
        repo.topics?.some(topic => topic.toLowerCase().includes(searchLower))
      )
    }

    // Apply language filter
    if (languageFilter && languageFilter !== 'all') {
      filtered = filtered.filter(repo => repo.language === languageFilter)
    }

    // Apply privacy filter
    if (!showPrivate) {
      filtered = filtered.filter(repo => !repo.private)
    }

    setFilteredRepositories(filtered)
  }, [repositories, searchTerm, languageFilter, showPrivate])

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication()
  }, [])

  // Load repositories when authentication is confirmed
  useEffect(() => {
    if (isAuthenticated === true) {
      // For GitHub OAuth users, automatically sync repositories
      autoSyncForGitHubUsers()
    } else if (isAuthenticated === false) {
      loadMockRepositories()
    }
  }, [sortBy, sortDirection, showPrivate, isAuthenticated])

  // Trigger GitHub OAuth sign in
  const handleGitHubSignIn = async () => {
    try {
      console.log('Starting GitHub OAuth flow...')
      const { data, error } = await signInWithGitHub()
      if (error) {
        console.error('GitHub OAuth error:', error)
        setError('Failed to start GitHub authentication')
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Failed to authenticate with GitHub')
    }
  }

  // Check user authentication
  const checkAuthentication = async () => {
    try {
      const { user, error } = await getCurrentUser()
      if (error) {
        console.error('Authentication error:', error)
        setAuthError(error instanceof Error ? error.message : 'Authentication failed')
        setIsAuthenticated(false)
      } else if (user) {
        setIsAuthenticated(true)
        setAuthError(null)
      } else {
        setIsAuthenticated(false)
        setAuthError('User not authenticated')
      }
    } catch (err) {
      console.error('Error checking authentication:', err)
      setAuthError('Failed to check authentication')
      setIsAuthenticated(false)
    }
  }

  // Auto-sync repositories for GitHub OAuth users
  const autoSyncForGitHubUsers = async () => {
    setIsAutoSyncing(true)
    try {
      // First try to load existing repositories from database
      const existingRepos = await repositoryService.getUserRepositories({
        includePrivate: showPrivate,
        sortBy,
        sortDirection,
        filters: {
          language: languageFilter !== 'all' ? languageFilter : undefined,
          searchTerm: searchTerm || undefined
        }
      })

      // If user has no repositories in database, automatically sync from GitHub
      if (existingRepos.length === 0) {
        console.log('No repositories found in database, auto-syncing from GitHub...')
        await syncRepositories()
      } else {
        // User has existing repositories, just load them
        setRepositories(existingRepos)
        setFilteredRepositories(existingRepos)
      }
    } catch (err) {
      console.error('Error in auto-sync:', err)
      // Fallback to regular load if auto-sync fails
      await loadRepositories()
    } finally {
      setIsAutoSyncing(false)
    }
  }

  // Load mock repositories for development/demo purposes
  const loadMockRepositories = () => {
    const mockRepos: UserRepository[] = [
      {
        id: 1,
        name: 'portfolio-website',
        full_name: 'testuser/portfolio-website',
        description: 'My personal portfolio website built with Next.js and Tailwind CSS',
        language: 'TypeScript',
        stargazers_count: 15,
        forks_count: 3,
        updated_at: '2024-01-15T10:30:00Z',
        created_at: '2023-12-01T08:00:00Z',
        html_url: 'https://github.com/testuser/portfolio-website',
        clone_url: 'https://github.com/testuser/portfolio-website.git',
        default_branch: 'main',
        topics: ['portfolio', 'nextjs', 'tailwindcss', 'typescript'],
        owner: {
          login: 'testuser',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
        },
        priority_order: 0,
        user_notes: 'Main portfolio project - needs README update',
        ai_analysis: {
          complexity_score: 65,
          tech_stack: ['TypeScript', 'Next.js', 'Tailwind CSS', 'React'],
          project_type: 'Web Application',
          completeness_score: 80,
          suggestions: ['Add more detailed README', 'Include live demo link'],
          generated_at: '2024-01-15T10:30:00Z'
        },
        is_featured: true,
        private: false,
        size: 2048,
        open_issues_count: 2,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        archived: false,
        disabled: false,
        pushed_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'react-todo-app',
        full_name: 'testuser/react-todo-app',
        description: 'A simple todo application built with React and local storage',
        language: 'JavaScript',
        stargazers_count: 8,
        forks_count: 2,
        updated_at: '2024-01-10T14:20:00Z',
        created_at: '2023-11-15T12:00:00Z',
        html_url: 'https://github.com/testuser/react-todo-app',
        clone_url: 'https://github.com/testuser/react-todo-app.git',
        default_branch: 'main',
        topics: ['react', 'javascript', 'todo', 'frontend'],
        owner: {
          login: 'testuser',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
        },
        priority_order: 1,
        user_notes: null,
        ai_analysis: null,
        is_featured: false,
        private: false,
        size: 1024,
        open_issues_count: 1,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        archived: false,
        disabled: false,
        pushed_at: '2024-01-10T14:20:00Z'
      },
      {
        id: 3,
        name: 'python-data-analysis',
        full_name: 'testuser/python-data-analysis',
        description: 'Data analysis scripts and notebooks for various datasets',
        language: 'Python',
        stargazers_count: 25,
        forks_count: 7,
        updated_at: '2024-01-12T09:15:00Z',
        created_at: '2023-10-20T16:30:00Z',
        html_url: 'https://github.com/testuser/python-data-analysis',
        clone_url: 'https://github.com/testuser/python-data-analysis.git',
        default_branch: 'main',
        topics: ['python', 'data-science', 'jupyter', 'pandas'],
        owner: {
          login: 'testuser',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
        },
        priority_order: 2,
        user_notes: 'Contains analysis for multiple projects',
        ai_analysis: {
          complexity_score: 75,
          tech_stack: ['Python', 'Pandas', 'Jupyter', 'NumPy'],
          project_type: 'Data Science/ML',
          completeness_score: 70,
          suggestions: ['Add requirements.txt', 'Document analysis methodology'],
          generated_at: '2024-01-12T09:15:00Z'
        },
        is_featured: true,
        private: false,
        size: 5120,
        open_issues_count: 0,
        has_issues: true,
        has_projects: true,
        has_wiki: false,
        archived: false,
        disabled: false,
        pushed_at: '2024-01-12T09:15:00Z'
      },
      {
        id: 4,
        name: 'api-server',
        full_name: 'testuser/api-server',
        description: 'RESTful API server built with Node.js and Express',
        language: 'JavaScript',
        stargazers_count: 12,
        forks_count: 4,
        updated_at: '2024-01-08T11:45:00Z',
        created_at: '2023-09-10T14:00:00Z',
        html_url: 'https://github.com/testuser/api-server',
        clone_url: 'https://github.com/testuser/api-server.git',
        default_branch: 'main',
        topics: ['nodejs', 'express', 'api', 'backend'],
        owner: {
          login: 'testuser',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
        },
        priority_order: 3,
        user_notes: null,
        ai_analysis: null,
        is_featured: false,
        private: true,
        size: 3072,
        open_issues_count: 3,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        archived: false,
        disabled: false,
        pushed_at: '2024-01-08T11:45:00Z'
      },
      {
        id: 5,
        name: 'mobile-app-flutter',
        full_name: 'testuser/mobile-app-flutter',
        description: 'Cross-platform mobile app built with Flutter',
        language: 'Dart',
        stargazers_count: 20,
        forks_count: 6,
        updated_at: '2024-01-14T16:00:00Z',
        created_at: '2023-08-05T10:30:00Z',
        html_url: 'https://github.com/testuser/mobile-app-flutter',
        clone_url: 'https://github.com/testuser/mobile-app-flutter.git',
        default_branch: 'main',
        topics: ['flutter', 'dart', 'mobile', 'cross-platform'],
        owner: {
          login: 'testuser',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
        },
        priority_order: 4,
        user_notes: 'In active development',
        ai_analysis: {
          complexity_score: 80,
          tech_stack: ['Dart', 'Flutter', 'Firebase'],
          project_type: 'Mobile Application',
          completeness_score: 85,
          suggestions: ['Add unit tests', 'Implement CI/CD pipeline'],
          generated_at: '2024-01-14T16:00:00Z'
        },
        is_featured: true,
        private: false,
        size: 4096,
        open_issues_count: 5,
        has_issues: true,
        has_projects: true,
        has_wiki: true,
        archived: false,
        disabled: false,
        pushed_at: '2024-01-14T16:00:00Z'
      }
    ]

    setRepositories(mockRepos)
    setFilteredRepositories(mockRepos)
  }



  const handleAnalyze = async (repoId: number) => {
    try {
      await repositoryService.analyzeAndStoreRepository(repoId)
      await loadRepositories() // Refresh to show updated analysis
      onRepositoryAnalyze?.(repoId)
    } catch (err) {
      console.error('Error analyzing repository:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze repository')
    }
  }

  const handleToggleFeatured = async (repoId: number) => {
    try {
      await repositoryService.toggleRepositoryFeatured(repoId)
      await loadRepositories() // Refresh to show updated status
      onRepositoryToggleFeatured?.(repoId)
    } catch (err) {
      console.error('Error toggling featured status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update repository')
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setFilteredRepositories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        setHasUnsavedChanges(true)
        return newItems
      })
    }
  }

  // Save repository order
  const saveRepositoryOrder = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      const repositoryIds = filteredRepositories.map(repo => repo.id)
      await repositoryService.updateRepositoryOrder(repositoryIds)
      setHasUnsavedChanges(false)
      await loadRepositories() // Refresh to show updated order
    } catch (err) {
      console.error('Error saving repository order:', err)
      setError(err instanceof Error ? err.message : 'Failed to save repository order')
    } finally {
      setIsSaving(false)
    }
  }

  if ((isLoading || isAutoSyncing) && repositories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Repositories</h2>
          <Button onClick={syncRepositories} disabled={isSyncing || isAutoSyncing}>
            {(isSyncing || isAutoSyncing) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isAutoSyncing ? 'Loading from GitHub...' : 'Sync from GitHub'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      {isAuthenticated === false && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Demo Mode: Showing sample repositories. 
                <a href="/auth/callback" className="underline ml-1">Sign in with GitHub</a> to sync your actual repositories.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Repositories</h2>
          <p className="text-muted-foreground">
            {filteredRepositories.length} of {repositories.length} repositories
            {isAuthenticated === false && " (Demo Data)"}
          </p>
        </div>
        
        <Button onClick={syncRepositories} disabled={isSyncing || isAutoSyncing || !isAuthenticated}>
          {(isSyncing || isAutoSyncing) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {!isAuthenticated 
            ? 'Sign in to Sync' 
            : (isSyncing || isAutoSyncing)
            ? 'Syncing...'
            : repositories.length === 0 
            ? 'Load from GitHub' 
            : 'Refresh from GitHub'
          }
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Language Filter */}
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {availableLanguages.map((language: string) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stars">Stars</SelectItem>
                <SelectItem value="forks">Forks</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Direction */}
            <Button
              variant="outline"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPrivate}
                onChange={(e) => setShowPrivate(e.target.checked)}
                className="rounded"
              />
              Include private repositories
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredRepositories.length === 0 && repositories.length === 0 && isAuthenticated && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
              <p className="text-muted-foreground mb-4">
                {isSyncing ? 'Loading your repositories from GitHub...' : 'Click below to load your GitHub repositories'}
              </p>
              <Button onClick={syncRepositories} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Github className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Loading Repositories...' : 'Load Repositories'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {!isLoading && filteredRepositories.length === 0 && repositories.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No repositories match your filters</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Changes Button */}
      {hasUnsavedChanges && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">You have unsaved changes to repository order</span>
              </div>
              <Button onClick={saveRepositoryOrder} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Apply Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Grid with Drag and Drop */}
      {!isLoading && filteredRepositories.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredRepositories.map(repo => repo.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRepositories.map((repository) => (
                <SortableRepositoryCard
                  key={repository.id}
                  repository={repository}
                  onAnalyze={handleAnalyze}
                  onToggleFeatured={handleToggleFeatured}
                  onUpdateNotes={onRepositoryUpdateNotes}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  GitBranch,
  Star,
  GitFork,
  Eye,
  Calendar,
  Code,
  Lock,
  Globe,
  ExternalLink,
  Settings,
  History,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'

interface Repository {
  id: number
  name: string
  full_name: string
  description?: string
  private: boolean
  language?: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  html_url: string
  topics?: string[]
  default_branch?: string
  open_issues_count?: number
}

interface Branch {
  name: string
  isDefault: boolean
  lastCommit: {
    message: string
    author: string
    date: string
    sha: string
  }
  isProtected: boolean
  aheadBy?: number
  behindBy?: number
}

interface RepositoryDetailModalProps {
  repository: Repository | null
  isOpen: boolean
  onClose: () => void
}

// Mock branch data - in real app this would come from GitHub API
const mockBranches: Branch[] = [
  {
    name: 'main',
    isDefault: true,
    lastCommit: {
      message: 'feat: add new dashboard components',
      author: 'john-doe',
      date: '2024-01-15T10:30:00Z',
      sha: 'abc123f'
    },
    isProtected: true
  },
  {
    name: 'develop',
    isDefault: false,
    lastCommit: {
      message: 'fix: resolve merge conflicts',
      author: 'jane-smith',
      date: '2024-01-14T16:45:00Z',
      sha: 'def456a'
    },
    isProtected: false,
    aheadBy: 3,
    behindBy: 1
  },
  {
    name: 'feature/user-auth',
    isDefault: false,
    lastCommit: {
      message: 'wip: implement oauth flow',
      author: 'dev-user',
      date: '2024-01-13T09:15:00Z',
      sha: 'ghi789b'
    },
    isProtected: false,
    aheadBy: 5,
    behindBy: 2
  }
]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

function BranchItem({ branch }: { branch: Branch }) {
  return (
    <Card className="p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <code className="font-mono text-sm font-medium">{branch.name}</code>
            {branch.isDefault && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
            {branch.isProtected && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                Protected
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mb-1">
            <span className="font-medium">{branch.lastCommit.author}</span>
            <span className="mx-1">•</span>
            <span>{formatDate(branch.lastCommit.date)}</span>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mb-2">
            {branch.lastCommit.message}
          </p>
          
          {(branch.aheadBy !== undefined || branch.behindBy !== undefined) && (
            <div className="flex items-center gap-3 text-xs">
              {branch.aheadBy !== undefined && branch.aheadBy > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{branch.aheadBy} ahead</span>
                </div>
              )}
              {branch.behindBy !== undefined && branch.behindBy > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="h-3 w-3" />
                  <span>{branch.behindBy} behind</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-3">
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <History className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function RepositoryDetailModal({ repository, isOpen, onClose }: RepositoryDetailModalProps) {
  if (!repository) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {repository.private ? (
                <Lock className="h-4 w-4 text-orange-500" />
              ) : (
                <Globe className="h-4 w-4 text-green-500" />
              )}
              <span className="font-mono">{repository.full_name}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                GitHub
              </a>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Repository Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Repository Info
                </h3>
                
                {repository.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {repository.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {repository.language && (
                    <div className="flex items-center gap-2">
                      <Code className="h-3 w-3" />
                      <span>{repository.language}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    <span>{repository.stargazers_count} stars</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <GitFork className="h-3 w-3" />
                    <span>{repository.forks_count} forks</span>
                  </div>
                  
                  {repository.open_issues_count !== undefined && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      <span>{repository.open_issues_count} open issues</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {formatDate(repository.updated_at)}</span>
                  </div>
                </div>
                
                {repository.topics && repository.topics.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium mb-2">Topics</div>
                    <div className="flex flex-wrap gap-1">
                      {repository.topics.slice(0, 6).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {repository.topics.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{repository.topics.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Branches */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Branches ({mockBranches.length})
                </h3>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {mockBranches.map((branch) => (
                    <BranchItem key={branch.name} branch={branch} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

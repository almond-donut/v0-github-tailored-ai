'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  GripVertical, 
  Star, 
  GitFork, 
  Eye, 
  Calendar,
  ExternalLink,
  Code,
  Lock,
  Globe,
  GitBranch,
  Save
} from 'lucide-react'
import { DeveloperLoader } from '@/components/ui/developer-loader'
import { LoadingButton } from '@/components/ui/loading-button'
import { RepositoryDetailModal } from '@/components/repository-detail-modal'

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
  is_featured?: boolean
  default_branch?: string
  open_issues_count?: number
}

interface CompactRepositoryItemProps {
  repository: Repository
  index: number
  isDragging: boolean
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, dropIndex: number) => void
  isAnalyzing?: boolean
  onRepositoryClick: (repository: Repository) => void
}

function CompactRepositoryItem({
  repository,
  index,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isAnalyzing = false,
  onRepositoryClick
}: CompactRepositoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or drag handle
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      return
    }
    onRepositoryClick(repository)
  }

  return (
    <Card 
      className={`
        p-3 border-l-4 border-l-blue-500 hover:border-l-blue-400 
        transition-all duration-200 cursor-pointer
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
        ${repository.is_featured ? 'border-l-yellow-500 hover:border-l-yellow-400' : ''}
        bg-card/50 backdrop-blur-sm
      `}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onClick={handleCardClick}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div className="flex-shrink-0 pt-1" data-drag-handle>
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        </div>

        {/* Bullet Point */}
        <div className="flex-shrink-0 pt-2">
          <div className={`w-2 h-2 rounded-full ${
            repository.is_featured ? 'bg-yellow-500' : 'bg-blue-500'
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex items-center space-x-1">
              {repository.private ? (
                <Lock className="h-3 w-3 text-orange-500" />
              ) : (
                <Globe className="h-3 w-3 text-green-500" />
              )}
              <h3 className="font-medium text-sm truncate">{repository.name}</h3>
            </div>
            
            {repository.is_featured && (
              <Badge variant="secondary" className="text-xs">Featured</Badge>
            )}
          </div>

          {repository.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {repository.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            {/* Left side - Language and stats */}
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              {repository.language && (
                <div className="flex items-center space-x-1">
                  <Code className="h-3 w-3" />
                  <span>{repository.language}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{repository.stargazers_count}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <GitFork className="h-3 w-3" />
                <span>{repository.forks_count}</span>
              </div>

              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(repository.updated_at)}</span>
              </div>
              
              {/* Branch info */}
              <div className="flex items-center space-x-1">
                <GitBranch className="h-3 w-3" />
                <span>{repository.default_branch || 'main'}</span>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-1">
              {isAnalyzing ? (
                <DeveloperLoader text="Analyzing" className="text-xs" />
              ) : (
                <>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                    Analyze
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(repository.html_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Topics */}
          {repository.topics && repository.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {repository.topics.slice(0, 4).map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs px-1 py-0">
                  {topic}
                </Badge>
              ))}
              {repository.topics.length > 4 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{repository.topics.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

interface CompactRepositoryListProps {
  repositories: Repository[]
  onReorder?: (repositories: Repository[]) => void
  isLoading?: boolean
  className?: string
}

export function CompactRepositoryList({ 
  repositories: initialRepositories, 
  onReorder,
  isLoading = false,
  className 
}: CompactRepositoryListProps) {
  const [repositories, setRepositories] = useState(initialRepositories)
  const [originalOrder, setOriginalOrder] = useState(initialRepositories)
  const [hasChanges, setHasChanges] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [analyzingIds, setAnalyzingIds] = useState<Set<number>>(new Set())
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', index.toString())
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newRepositories = [...repositories]
    const draggedRepo = newRepositories[draggedIndex]
    
    // Remove the dragged item
    newRepositories.splice(draggedIndex, 1)
    
    // Insert at new position
    newRepositories.splice(dropIndex, 0, draggedRepo)
    
    setRepositories(newRepositories)
    setHasChanges(true) // Mark as having staged changes
    setDraggedIndex(null)
  }

  const handleApplyChanges = async () => {
    setIsApplying(true)
    
    // Simulate applying changes
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setOriginalOrder(repositories)
    setHasChanges(false)
    onReorder?.(repositories)
    setIsApplying(false)
  }

  const handleDiscardChanges = () => {
    setRepositories(originalOrder)
    setHasChanges(false)
  }

  const handleRepositoryClick = (repository: Repository) => {
    setSelectedRepository(repository)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRepository(null)
  }

  const handleAnalyze = (repoId: number) => {
    setAnalyzingIds(prev => new Set(prev).add(repoId))
    
    // Simulate analysis
    setTimeout(() => {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(repoId)
        return newSet
      })
    }, 3000)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="w-2 h-2 bg-muted rounded-full mt-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="flex space-x-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-12" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {repositories.length} repositories • Drag to reorder
        </div>
        <DeveloperLoader text="Ready" className="text-xs" />
      </div>
      
      {repositories.map((repo, index) => (
        <CompactRepositoryItem
          key={repo.id}
          repository={repo}
          index={index}
          isDragging={draggedIndex === index}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isAnalyzing={analyzingIds.has(repo.id)}
          onRepositoryClick={handleRepositoryClick}
        />
      ))}
      
      {repositories.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No repositories found</p>
            <p className="text-xs mt-1">Connect your GitHub account to get started</p>
          </div>
        </Card>
      )}
      
      {/* Apply Changes Section */}
      {hasChanges && (
        <Card className="p-4 mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Staging Changes
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Repository order has been modified but not applied yet
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDiscardChanges}
                className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                Discard
              </Button>
              <LoadingButton
                onClick={handleApplyChanges}
                isLoading={isApplying}
                loadingText="Applying"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                size="sm"
              >
                <Save className="h-3 w-3 mr-1" />
                Apply Changes
              </LoadingButton>
            </div>
          </div>
        </Card>
      )}
      
      {/* Repository Detail Modal */}
      <RepositoryDetailModal
        repository={selectedRepository}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

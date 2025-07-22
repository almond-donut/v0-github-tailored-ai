'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Star, 
  GitFork, 
  Eye, 
  ExternalLink, 
  GripVertical,
  Circle,
  CheckCircle,
  Sparkles,
  MoreHorizontal,
  Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import type { UserRepository } from '@/lib/repository-service'

interface CompactRepositoryItemProps {
  repository: UserRepository
  onAnalyze: (repository: UserRepository) => void
  onToggleFeatured: (repository: UserRepository) => void
  onUpdateNotes: (repository: UserRepository, notes: string) => void
}

export function CompactRepositoryItem({
  repository,
  onAnalyze,
  onToggleFeatured,
  onUpdateNotes
}: CompactRepositoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: repository.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getLanguageColor = (language: string) => {
    // All languages will have the same color in black and white theme
    return 'bg-neutral-500'
  }

  const hasAnalysis = repository.ai_analysis !== null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg border border-transparent 
        bg-card hover:border-neutral-700 transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 shadow-lg' : ''}
        ${repository.is_featured ? 'ring-2 ring-neutral-500/20 bg-neutral-500/5' : ''}
      `}
      {...attributes}
    >
      {/* Drag Handle */}
      <button
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Status Indicator */}
      <div className="flex-shrink-0">
        {repository.is_featured ? (
          <CheckCircle className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Repository Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm truncate">
            {repository.name}
          </h3>
          
          {/* Language Badge */}
          {repository.language && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getLanguageColor(repository.language)}`} />
              <span className="text-xs text-muted-foreground">{repository.language}</span>
            </div>
          )}

          {/* Featured Star */}
          {repository.is_featured && (
            <Sparkles className="h-3 w-3 text-primary" />
          )}

          {/* Private Badge */}
          {repository.private && (
            <Badge variant="secondary" className="text-xs py-0">Private</Badge>
          )}
        </div>

        {/* Description */}
        {repository.description && (
          <p className="text-xs text-muted-foreground truncate mb-1">
            {repository.description}
          </p>
        )}

        {/* Stats & Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {repository.stargazers_count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{repository.stargazers_count}</span>
            </div>
          )}
          
          {repository.forks_count > 0 && (
            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              <span>{repository.forks_count}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(repository.updated_at), { addSuffix: true })}</span>
          </div>

          {/* AI Analysis Status */}
          {hasAnalysis && (
            <Badge variant="outline" className="text-xs py-0">
              <Sparkles className="h-2 w-2 mr-1" />
              Analyzed
            </Badge>
          )}
        </div>

        {/* Topics */}
        {repository.topics && repository.topics.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {repository.topics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs py-0 px-1">
                {topic}
              </Badge>
            ))}
            {repository.topics.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{repository.topics.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(repository.html_url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFeatured(repository)}>
              <Star className="h-4 w-4 mr-2" />
              {repository.is_featured ? 'Remove from Featured' : 'Add to Featured'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAnalyze(repository)}>
              <Sparkles className="h-4 w-4 mr-2" />
              {hasAnalysis ? 'Re-analyze' : 'Analyze with AI'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

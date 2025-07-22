'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Star, 
  GitFork, 
  Clock, 
  ExternalLink, 
  Lock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  GripVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { UserRepository } from '@/lib/repository-service'

export interface RepositoryCardProps {
  repository: UserRepository
  isDragging?: boolean
  onAnalyze?: (repoId: number) => void
  onToggleFeatured?: (repoId: number) => void
  onUpdateNotes?: (repoId: number, notes: string) => void
}

export function RepositoryCard({ 
  repository, 
  isDragging = false,
  onAnalyze,
  onToggleFeatured,
  onUpdateNotes
}: RepositoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: repository.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'C++': 'bg-blue-600',
      'C#': 'bg-purple-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'PHP': 'bg-indigo-500',
      'Ruby': 'bg-red-500',
      'Swift': 'bg-orange-400',
      'Kotlin': 'bg-purple-600',
    }
    return colors[language || ''] || 'bg-gray-500'
  }

  const getComplexityBadge = (score: number) => {
    if (score >= 80) return { label: 'Complex', variant: 'destructive' as const }
    if (score >= 60) return { label: 'Moderate', variant: 'default' as const }
    if (score >= 40) return { label: 'Simple', variant: 'secondary' as const }
    return { label: 'Basic', variant: 'outline' as const }
  }

  const getCompletenessBadge = (score: number) => {
    if (score >= 80) return { label: 'Complete', variant: 'default' as const, icon: CheckCircle2 }
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const, icon: CheckCircle2 }
    if (score >= 40) return { label: 'Needs Work', variant: 'outline' as const, icon: AlertCircle }
    return { label: 'Incomplete', variant: 'destructive' as const, icon: AlertCircle }
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 hover:shadow-md ${
        isSortableDragging ? 'opacity-50 rotate-2 shadow-lg' : ''
      } ${repository.is_featured ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Drag Handle */}
            <div 
              className="mt-1 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg font-semibold truncate">
                  {repository.name}
                </CardTitle>
                {repository.private && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                {repository.is_featured && (
                  <Badge variant="default" className="text-xs">Featured</Badge>
                )}
              </div>
              
              <CardDescription className="line-clamp-2">
                {repository.description || 'No description available'}
              </CardDescription>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Repository Stats */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {repository.language && (
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${getLanguageColor(repository.language)}`} />
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
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(repository.updated_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Topics */}
        {repository.topics && repository.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {repository.topics.slice(0, 5).map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {repository.topics.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{repository.topics.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {repository.ai_analysis && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Analysis</span>
              <div className="flex space-x-2">
                {(() => {
                  const complexity = getComplexityBadge(repository.ai_analysis.complexity_score)
                  return <Badge variant={complexity.variant} className="text-xs">{complexity.label}</Badge>
                })()}
                {(() => {
                  const completeness = getCompletenessBadge(repository.ai_analysis.completeness_score)
                  const Icon = completeness.icon
                  return (
                    <Badge variant={completeness.variant} className="text-xs flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {completeness.label}
                    </Badge>
                  )
                })()}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Type:</span> {repository.ai_analysis.project_type}
            </div>
            
            {repository.ai_analysis.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {repository.ai_analysis.tech_stack.slice(0, 4).map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
            
            {repository.ai_analysis.suggestions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Suggestions:</span> {repository.ai_analysis.suggestions[0]}
              </div>
            )}
          </div>
        )}

        {/* User Notes */}
        {repository.user_notes && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-blue-700 dark:text-blue-300">Note:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-400">{repository.user_notes}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAnalyze?.(repository.id)}
              disabled={!onAnalyze}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              {repository.ai_analysis ? 'Re-analyze' : 'Analyze'}
            </Button>
            
            <Button 
              variant={repository.is_featured ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFeatured?.(repository.id)}
              disabled={!onToggleFeatured}
            >
              {repository.is_featured ? 'Featured' : 'Feature'}
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <a 
              href={repository.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
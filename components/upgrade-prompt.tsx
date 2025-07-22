import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRightIcon, 
  Github, 
  Zap,
  Lock,
  Star,
  Eye,
  GitBranch,
  FileText,
  Clock
} from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  onUpgrade: () => void
  onDismiss?: () => void
}

export function UpgradePrompt({ feature, onUpgrade, onDismiss }: UpgradePromptProps) {
  const getFeatureConfig = (feature: string) => {
    switch (feature) {
      case 'branches':
        return {
          icon: GitBranch,
          title: 'Branch Visualization',
          description: 'View and explore all repository branches',
          benefits: [
            'See all active branches',
            'Check branch protection status',
            'Navigate branch hierarchies'
          ]
        }
      case 'commits':
        return {
          icon: Clock,
          title: 'Commit History',
          description: 'Explore detailed commit information',
          benefits: [
            'View commit messages and changes',
            'See commit authors and timestamps',
            'Track project history'
          ]
        }
      case 'files':
        return {
          icon: FileText,
          title: 'File Content Access',
          description: 'Read and analyze repository files',
          benefits: [
            'Browse file contents',
            'Get AI insights on your code',
            'Search within files'
          ]
        }
      default:
        return {
          icon: Eye,
          title: 'Advanced GitHub Features',
          description: 'Unlock full GitHub integration',
          benefits: [
            'Real-time data sync',
            'Advanced repository insights',
            'Enhanced AI analysis'
          ]
        }
    }
  }

  const config = getFeatureConfig(feature)
  const IconComponent = config.icon

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <IconComponent className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {config.title}
              <Badge className="text-xs bg-blue-600">Premium</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              {config.description}
            </CardDescription>
          </div>
          <div className="p-1 bg-amber-100 rounded-full">
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-700">🚀 Unlock this feature with GitHub token:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            {config.benefits.map((benefit, index) => (
              <li key={index}>• {benefit}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white/70 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Quick Start Users</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            You're currently in Quick Start mode. Upgrade to unlock advanced features like this one!
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={onUpgrade}
              className="flex-1 group bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Github className="h-4 w-4 mr-2" />
              Setup GitHub Token
              <ArrowRightIcon
                className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                size={14}
                aria-hidden="true"
              />
            </Button>
            
            {onDismiss && (
              <Button 
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Maybe later
              </Button>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ⏱️ Setup takes only 2 minutes • 🔒 Your token stays secure in your browser
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

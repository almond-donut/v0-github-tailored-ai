import { geminiAI } from './gemini'

export interface RepositoryAnalysisService {
  analyzeRepository(repoData: any, options?: RepositoryAnalysisOptions): Promise<RepositoryAnalysisResult>
  analyzeRepositoryWithContext(repoData: any, context: RepositoryContext): Promise<DetailedAnalysisResult>
}

export interface RepositoryAnalysisOptions {
  userProfile?: {
    targetJob?: string
    techStack?: string
    userNotes?: string
  }
}

export interface RepositoryContext {
  readmeContent?: string
  folderStructure?: string
  packageJson?: any
  userProfile?: {
    targetJob?: string
    techStack?: string
    userNotes?: string
  }
}

export interface RepositoryAnalysisResult {
  analysis: string
  suggestions: Suggestion[]
  score: number
  resumeBullet: string
}

export interface DetailedAnalysisResult extends RepositoryAnalysisResult {
  recruitersView: string
  projectSummary: string
  improvementPriorities: string[]
}

export interface Suggestion {
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export class RepositoryAnalysisServiceImpl implements RepositoryAnalysisService {
  async analyzeRepository(repoData: any, options?: RepositoryAnalysisOptions): Promise<RepositoryAnalysisResult> {
    try {
      const result = await geminiAI.analyzeRepository(repoData, options?.userProfile)
      
      return {
        analysis: result.analysis || 'Analysis completed',
        suggestions: result.suggestions || [],
        score: result.score || 75,
        resumeBullet: result.resumeBullet || `Built ${repoData.name} using ${repoData.language || 'modern technologies'}`
      }
    } catch (error) {
      console.error('Repository analysis error:', error)
      throw new Error('Failed to analyze repository')
    }
  }

  async analyzeRepositoryWithContext(repoData: any, context: RepositoryContext): Promise<DetailedAnalysisResult> {
    try {
      const result = await geminiAI.analyzeRepositoryDetailed(repoData, {
        readmeContent: context.readmeContent,
        folderStructure: context.folderStructure,
        userProfile: context.userProfile
      })
      
      return {
        analysis: result.analysis || 'Detailed analysis completed',
        suggestions: result.suggestions || [],
        score: result.score || 75,
        resumeBullet: result.resumeBullet || `Built ${repoData.name} using ${repoData.language || 'modern technologies'}`,
        recruitersView: result.recruitersView || 'This repository demonstrates good technical skills',
        projectSummary: this.extractProjectSummary(result.analysis),
        improvementPriorities: this.extractImprovementPriorities(result.suggestions)
      }
    } catch (error) {
      console.error('Detailed repository analysis error:', error)
      throw new Error('Failed to analyze repository with context')
    }
  }

  private extractProjectSummary(analysis: string): string {
    const lines = analysis.split('\n')
    let inSummarySection = false
    let summary = ''
    
    for (const line of lines) {
      if (line.includes('✅') && line.includes('What This Project Does')) {
        inSummarySection = true
        continue
      }
      
      if (inSummarySection && line.startsWith('##')) {
        break
      }
      
      if (inSummarySection && line.trim()) {
        summary += line.trim() + ' '
      }
    }
    
    return summary.trim() || 'A well-structured software project demonstrating modern development practices.'
  }

  private extractImprovementPriorities(suggestions: Suggestion[]): string[] {
    const priorities = suggestions
      .filter(s => s.priority === 'high')
      .map(s => s.title)
      .slice(0, 3) // Top 3 priorities
    
    if (priorities.length === 0) {
      return ['Improve documentation', 'Add live demo', 'Enhance code structure']
    }
    
    return priorities
  }
}

// Create singleton instance
export const repositoryAnalysisService = new RepositoryAnalysisServiceImpl()

// Helper function to analyze GitHub repository from URL
export async function analyzeGitHubRepository(
  repoUrl: string, 
  userProfile?: {
    targetJob?: string
    techStack?: string
    userNotes?: string
  }
): Promise<RepositoryAnalysisResult> {
  // Extract owner and repo name from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    throw new Error('Invalid GitHub repository URL')
  }

  const [, owner, repoName] = match
  
  // Mock repository data (in real implementation, you'd fetch from GitHub API)
  const repoData = {
    name: repoName,
    full_name: `${owner}/${repoName}`,
    description: 'GitHub repository analysis',
    language: 'TypeScript',
    stargazers_count: 0,
    forks_count: 0,
    html_url: repoUrl
  }

  return repositoryAnalysisService.analyzeRepository(repoData, { userProfile })
}

// Helper function for detailed analysis with README and folder structure
export async function analyzeRepositoryDetailed(
  repoData: any,
  readmeContent: string,
  folderStructure: string,
  userProfile?: {
    targetJob?: string
    techStack?: string
    userNotes?: string
  }
): Promise<DetailedAnalysisResult> {
  const context: RepositoryContext = {
    readmeContent,
    folderStructure,
    userProfile
  }

  return repositoryAnalysisService.analyzeRepositoryWithContext(repoData, context)
}

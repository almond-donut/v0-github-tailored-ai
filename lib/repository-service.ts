import { supabase } from './supabase'
import {
    fetchUserRepositoriesWithRetry,
    analyzeRepository,
    handleGitHubAPIError,
    transformRepositoryData,
    filterRepositories,
    sortRepositories
} from './github'
import type { GitHubRepository } from './supabase'

export interface RepositoryAnalysis {
    complexity_score: number
    tech_stack: string[]
    project_type: string
    completeness_score: number
    suggestions: string[]
    generated_at: string
}

export interface UserRepository extends GitHubRepository {
    priority_order: number
    user_notes: string | null
    ai_analysis: RepositoryAnalysis | null
    is_featured: boolean
}

export class RepositoryService {
    private userId: string | null = null

    constructor(userId?: string) {
        this.userId = userId || null
    }

    async ensureUserId(): Promise<string> {
        if (!this.userId) {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) {
                throw new Error('User not authenticated')
            }
            this.userId = user.id
        }
        return this.userId
    }

    /**
     * Sync user repositories from GitHub to local database
     */
    async syncRepositoriesFromGitHub(): Promise<UserRepository[]> {
        try {
            const userId = await this.ensureUserId()

            // Fetch repositories from GitHub
            const githubRepos = await fetchUserRepositoriesWithRetry()

            // Get existing repositories from database
            const { data: existingRepos, error: fetchError } = await supabase
                .from('user_repositories')
                .select('*')
                .eq('user_id', userId)

            if (fetchError) {
                throw new Error(`Failed to fetch existing repositories: ${fetchError.message}`)
            }

            const existingRepoMap = new Map(
                existingRepos?.map(repo => [repo.github_repo_id, repo]) || []
            )

            const upsertData = githubRepos.map((repo, index) => {
                const existing = existingRepoMap.get(repo.id)
                return {
                    user_id: userId,
                    github_repo_id: repo.id,
                    repo_data: transformRepositoryData(repo),
                    priority_order: existing?.priority_order ?? index,
                    user_notes: existing?.user_notes || null,
                    ai_analysis: existing?.ai_analysis || null,
                    is_featured: existing?.is_featured || false,
                    updated_at: new Date().toISOString()
                }
            })

            // Upsert repositories
            const { data: upsertedRepos, error: upsertError } = await supabase
                .from('user_repositories')
                .upsert(upsertData, {
                    onConflict: 'user_id,github_repo_id',
                    ignoreDuplicates: false
                })
                .select('*')

            if (upsertError) {
                throw new Error(`Failed to sync repositories: ${upsertError.message}`)
            }

            return this.transformToUserRepositories(upsertedRepos || [])
        } catch (error) {
            console.error('Error syncing repositories:', error)
            throw new Error(handleGitHubAPIError(error))
        }
    }

    /**
     * Get user repositories from database
     */
    async getUserRepositories(options: {
        includePrivate?: boolean
        sortBy?: 'name' | 'updated' | 'created' | 'stars' | 'forks' | 'priority'
        sortDirection?: 'asc' | 'desc'
        filters?: {
            language?: string
            hasDescription?: boolean
            minStars?: number
            searchTerm?: string
        }
    } = {}): Promise<UserRepository[]> {
        try {
            const userId = await this.ensureUserId()

            let query = supabase
                .from('user_repositories')
                .select('*')
                .eq('user_id', userId)

            if (!options.includePrivate) {
                query = query.eq('repo_data->>private', 'false')
            }

            const { data: repos, error } = await query

            if (error) {
                throw new Error(`Failed to fetch repositories: ${error.message}`)
            }

            let userRepos = this.transformToUserRepositories(repos || [])

            // Apply filters
            if (options.filters) {
                const githubRepos = userRepos.map(repo => repo as GitHubRepository)
                const filtered = filterRepositories(githubRepos, options.filters)
                userRepos = userRepos.filter(repo =>
                    filtered.some(f => f.id === repo.id)
                )
            }

            // Apply sorting
            if (options.sortBy) {
                const githubRepos = userRepos.map(repo => repo as GitHubRepository)
                const sorted = sortRepositories(
                    githubRepos,
                    options.sortBy,
                    options.sortDirection
                )
                userRepos = sorted.map(repo => {
                    const userRepo = userRepos.find(ur => ur.id === repo.id)!
                    return userRepo
                })
            }

            return userRepos
        } catch (error) {
            console.error('Error fetching user repositories:', error)
            throw error
        }
    }

    /**
     * Update repository priority order
     */
    async updateRepositoryOrder(repositoryIds: number[]): Promise<void> {
        try {
            const userId = await this.ensureUserId()

            const updates = repositoryIds.map((repoId, index) => ({
                user_id: userId,
                github_repo_id: repoId,
                priority_order: index,
                updated_at: new Date().toISOString()
            }))

            const { error } = await supabase
                .from('user_repositories')
                .upsert(updates, {
                    onConflict: 'user_id,github_repo_id',
                    ignoreDuplicates: false
                })

            if (error) {
                throw new Error(`Failed to update repository order: ${error.message}`)
            }
        } catch (error) {
            console.error('Error updating repository order:', error)
            throw error
        }
    }

    /**
     * Update repository notes
     */
    async updateRepositoryNotes(repoId: number, notes: string): Promise<void> {
        try {
            const userId = await this.ensureUserId()

            const { error } = await supabase
                .from('user_repositories')
                .update({
                    user_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('github_repo_id', repoId)

            if (error) {
                throw new Error(`Failed to update repository notes: ${error.message}`)
            }
        } catch (error) {
            console.error('Error updating repository notes:', error)
            throw error
        }
    }

    /**
     * Toggle repository featured status
     */
    async toggleRepositoryFeatured(repoId: number): Promise<boolean> {
        try {
            const userId = await this.ensureUserId()

            // Get current status
            const { data: repo, error: fetchError } = await supabase
                .from('user_repositories')
                .select('is_featured')
                .eq('user_id', userId)
                .eq('github_repo_id', repoId)
                .single()

            if (fetchError) {
                throw new Error(`Failed to fetch repository: ${fetchError.message}`)
            }

            const newFeaturedStatus = !repo.is_featured

            const { error: updateError } = await supabase
                .from('user_repositories')
                .update({
                    is_featured: newFeaturedStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('github_repo_id', repoId)

            if (updateError) {
                throw new Error(`Failed to update repository featured status: ${updateError.message}`)
            }

            return newFeaturedStatus
        } catch (error) {
            console.error('Error toggling repository featured status:', error)
            throw error
        }
    }

    /**
     * Analyze repository and store AI analysis
     */
    async analyzeAndStoreRepository(repoId: number): Promise<RepositoryAnalysis> {
        try {
            const userId = await this.ensureUserId()

            // Get repository data
            const { data: userRepo, error: fetchError } = await supabase
                .from('user_repositories')
                .select('repo_data')
                .eq('user_id', userId)
                .eq('github_repo_id', repoId)
                .single()

            if (fetchError || !userRepo) {
                throw new Error('Repository not found')
            }

            const repo = userRepo.repo_data as GitHubRepository

            // Analyze repository using GitHub API
            const analysis = await analyzeRepository(repo)

            // Generate AI analysis (simplified for now)
            const aiAnalysis: RepositoryAnalysis = {
                complexity_score: this.calculateComplexityScore(repo, analysis),
                tech_stack: this.extractTechStack(repo, analysis),
                project_type: this.determineProjectType(repo, analysis),
                completeness_score: this.calculateCompletenessScore(repo, analysis),
                suggestions: this.generateSuggestions(repo, analysis),
                generated_at: new Date().toISOString()
            }

            // Store analysis
            const { error: updateError } = await supabase
                .from('user_repositories')
                .update({
                    ai_analysis: aiAnalysis,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('github_repo_id', repoId)

            if (updateError) {
                throw new Error(`Failed to store repository analysis: ${updateError.message}`)
            }

            return aiAnalysis
        } catch (error) {
            console.error('Error analyzing repository:', error)
            throw error
        }
    }

    private calculateComplexityScore(repo: GitHubRepository, analysis: any): number {
        let score = 0

        // Base score from repository size
        if (repo.size && repo.size > 10000) score += 30
        else if (repo.size && repo.size > 1000) score += 20
        else score += 10

        // Language complexity
        const complexLanguages = ['C++', 'Rust', 'Go', 'Java', 'C#']
        if (complexLanguages.includes(repo.language || '')) score += 20

        // Number of languages
        const languageCount = Object.keys(analysis.languages || {}).length
        score += Math.min(languageCount * 5, 25)

        // Stars and forks indicate complexity
        score += Math.min(repo.stargazers_count * 2, 20)
        score += Math.min(repo.forks_count * 3, 15)

        return Math.min(score, 100)
    }

    private extractTechStack(repo: GitHubRepository, analysis: any): string[] {
        const techStack = []

        // Primary language
        if (repo.language) {
            techStack.push(repo.language)
        }

        // Other languages from analysis
        const languages = Object.keys(analysis.languages || {})
        techStack.push(...languages.filter(lang => lang !== repo.language))

        // Topics as tech stack indicators
        if (repo.topics) {
            techStack.push(...repo.topics)
        }

        return [...new Set(techStack)].slice(0, 10) // Limit to 10 items
    }

    private determineProjectType(repo: GitHubRepository, analysis: any): string {
        const name = repo.name.toLowerCase()
        const description = (repo.description || '').toLowerCase()
        const topics = repo.topics || []

        // Check for common project types
        if (topics.includes('web') || topics.includes('website') ||
            name.includes('web') || description.includes('web')) {
            return 'Web Application'
        }

        if (topics.includes('api') || name.includes('api') || description.includes('api')) {
            return 'API/Backend'
        }

        if (topics.includes('mobile') || topics.includes('android') || topics.includes('ios')) {
            return 'Mobile Application'
        }

        if (topics.includes('library') || name.includes('lib') || description.includes('library')) {
            return 'Library/Package'
        }

        if (topics.includes('cli') || topics.includes('command-line') ||
            name.includes('cli') || description.includes('command')) {
            return 'CLI Tool'
        }

        if (repo.language === 'Python' && (topics.includes('data-science') ||
            topics.includes('machine-learning') || description.includes('data'))) {
            return 'Data Science/ML'
        }

        return 'General Project'
    }

    private calculateCompletenessScore(repo: GitHubRepository, analysis: any): number {
        let score = 0

        // Has description
        if (repo.description && repo.description.length > 10) score += 20

        // Has README
        if (analysis.hasReadme) score += 25

        // Has topics/tags
        if (repo.topics && repo.topics.length > 0) score += 15

        // Recent activity
        const lastUpdate = new Date(repo.updated_at)
        const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        if (monthsOld < 6) score += 20
        else if (monthsOld < 12) score += 10

        // Has issues enabled
        if (repo.has_issues) score += 10

        // Has multiple commits (indicated by forks or stars)
        if (repo.stargazers_count > 0 || repo.forks_count > 0) score += 10

        return Math.min(score, 100)
    }

    private generateSuggestions(repo: GitHubRepository, analysis: any): string[] {
        const suggestions = []

        if (!repo.description || repo.description.length < 10) {
            suggestions.push('Add a detailed description to explain what your project does')
        }

        if (!analysis.hasReadme) {
            suggestions.push('Create a comprehensive README with installation and usage instructions')
        }

        if (!repo.topics || repo.topics.length === 0) {
            suggestions.push('Add relevant topics/tags to help others discover your project')
        }

        const lastUpdate = new Date(repo.updated_at)
        const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        if (monthsOld > 12) {
            suggestions.push('Consider updating the project or archiving if no longer maintained')
        }

        if (repo.stargazers_count === 0 && repo.forks_count === 0) {
            suggestions.push('Share your project on social media or relevant communities to gain visibility')
        }

        if (!repo.has_issues) {
            suggestions.push('Enable issues to allow others to report bugs and request features')
        }

        return suggestions.slice(0, 5) // Limit to 5 suggestions
    }

    private transformToUserRepositories(dbRepos: any[]): UserRepository[] {
        return dbRepos.map(dbRepo => ({
            ...dbRepo.repo_data,
            priority_order: dbRepo.priority_order,
            user_notes: dbRepo.user_notes,
            ai_analysis: dbRepo.ai_analysis,
            is_featured: dbRepo.is_featured
        }))
    }
}

// Singleton instance
let repositoryService: RepositoryService | null = null

export const getRepositoryService = (userId?: string): RepositoryService => {
    if (!repositoryService || (userId && repositoryService['userId'] !== userId)) {
        repositoryService = new RepositoryService(userId)
    }
    return repositoryService
}

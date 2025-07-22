import { getGitHubAccessToken } from './auth'
import { GitHubRepository } from './supabase'

const PERSONAL_TOKEN_STORAGE_KEY = 'github_personal_token'

export interface GitHubAPIError {
  message: string
  status: number
  documentation_url?: string
}

export class GitHubAPI {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  async ensureToken() {
    if (!this.accessToken) {
      // First try to get OAuth token from Supabase
      const { token: oauthToken, error } = await getGitHubAccessToken()
      
      if (oauthToken) {
        this.accessToken = oauthToken
        return
      }
      
      // Fallback to personal access token from localStorage
      const personalToken = localStorage.getItem(PERSONAL_TOKEN_STORAGE_KEY)
      if (personalToken) {
        this.accessToken = personalToken
        return
      }
      
      // If neither works, throw error
      throw new Error('No GitHub access token available. Please set up your GitHub token in settings.')
    }
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureToken()

    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error: GitHubAPIError = {
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        documentation_url: errorData.documentation_url,
      }
      throw error
    }

    return response.json()
  }

  async getUserRepositories(options: {
    visibility?: 'all' | 'public' | 'private'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      visibility: options.visibility || 'all',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: (options.per_page || 100).toString(),
      page: (options.page || 1).toString(),
    })

    const repositories = await this.makeRequest<GitHubRepository[]>(
      `/user/repos?${params.toString()}`
    )

    return repositories
  }

  async getAllUserRepositories(): Promise<GitHubRepository[]> {
    const allRepos: GitHubRepository[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const repos = await this.getUserRepositories({
        per_page: perPage,
        page: page,
        sort: 'updated',
        direction: 'desc'
      })

      if (repos.length === 0) break

      allRepos.push(...repos)

      if (repos.length < perPage) break
      page++
    }

    return allRepos
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`)
  }

  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = ''
  ): Promise<any[]> {
    return this.makeRequest<any[]>(`/repos/${owner}/${repo}/contents/${path}`)
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<any> {
    try {
      return await this.makeRequest<any>(`/repos/${owner}/${repo}/readme`)
    } catch (error) {
      if ((error as GitHubAPIError).status === 404) {
        return null // No README found
      }
      throw error
    }
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.makeRequest<Record<string, number>>(`/repos/${owner}/${repo}/languages`)
  }

  async getRepositoryTopics(owner: string, repo: string): Promise<{ names: string[] }> {
    return this.makeRequest<{ names: string[] }>(`/repos/${owner}/${repo}/topics`)
  }

  async getBranches(owner: string, repo: string): Promise<any[]> {
    return this.makeRequest<any[]>(`/repos/${owner}/${repo}/branches`)
  }

  async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string
  ): Promise<any> {
    const body = {
      message,
      content: Buffer.from(content).toString('base64'),
      ...(branch && { branch })
    }

    return this.makeRequest(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha: string,
    branch?: string
  ): Promise<any> {
    const body = {
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      ...(branch && { branch })
    }

    return this.makeRequest(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<any> {
    const requestBody = {
      title,
      head,
      base,
      body: body || `Automated changes generated by GitHub Portfolio Organizer`
    }

    return this.makeRequest(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })
  }

  async getRateLimitStatus(): Promise<any> {
    return this.makeRequest('/rate_limit')
  }
}

// Singleton instance
let githubAPI: GitHubAPI | null = null

export const getGitHubAPI = async (): Promise<GitHubAPI> => {
  if (!githubAPI) {
    githubAPI = new GitHubAPI()
  }
  return githubAPI
}

// Helper functions for common operations
export const fetchUserRepositories = async (): Promise<GitHubRepository[]> => {
  try {
    const api = await getGitHubAPI()
    return await api.getAllUserRepositories()
  } catch (error) {
    console.error('Error fetching user repositories:', error)
    throw error
  }
}

export const analyzeRepository = async (repo: GitHubRepository) => {
  try {
    const api = await getGitHubAPI()
    const [owner, repoName] = repo.full_name.split('/')

    const [languages, topics, readme] = await Promise.all([
      api.getRepositoryLanguages(owner, repoName).catch(() => ({})),
      api.getRepositoryTopics(owner, repoName).catch(() => ({ names: [] })),
      api.getRepositoryReadme(owner, repoName).catch(() => null)
    ])

    return {
      languages,
      topics: topics.names,
      hasReadme: !!readme,
      readmeContent: readme?.content ? Buffer.from(readme.content, 'base64').toString() : null
    }
  } catch (error) {
    console.error(`Error analyzing repository ${repo.full_name}:`, error)
    return {
      languages: {},
      topics: [],
      hasReadme: false,
      readmeContent: null
    }
  }
}

// Enhanced error handling utilities
export const isRateLimitError = (error: any): boolean => {
  return error?.status === 403 && error?.message?.includes('rate limit')
}

export const isTokenExpiredError = (error: any): boolean => {
  return error?.status === 401
}

export const handleGitHubAPIError = (error: any): string => {
  if (isRateLimitError(error)) {
    return 'GitHub API rate limit exceeded. Please try again later.'
  }

  if (isTokenExpiredError(error)) {
    return 'GitHub access token has expired. Please re-authenticate.'
  }

  if (error?.status === 404) {
    return 'Repository not found or access denied.'
  }

  if (error?.status === 403) {
    return 'Access forbidden. Check repository permissions.'
  }

  return error?.message || 'An unexpected error occurred while accessing GitHub API.'
}

// Repository data transformation utilities
export const transformRepositoryData = (repo: GitHubRepository) => {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at,
    created_at: repo.created_at,
    html_url: repo.html_url,
    clone_url: repo.clone_url,
    default_branch: repo.default_branch,
    topics: repo.topics || [],
    private: repo.private,
    owner: repo.owner,
    // Custom fields for our app
    priority_order: 0,
    user_notes: null,
    ai_analysis: null,
    is_featured: false,
    size: repo.size,
    open_issues_count: repo.open_issues_count,
    has_issues: repo.has_issues,
    has_projects: repo.has_projects,
    has_wiki: repo.has_wiki,
    archived: repo.archived,
    disabled: repo.disabled,
    pushed_at: repo.pushed_at
  }
}

// Retry mechanism for API calls
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on authentication errors or client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error &&
        typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

// Enhanced repository fetching with retry and error handling
export const fetchUserRepositoriesWithRetry = async (): Promise<GitHubRepository[]> => {
  return withRetry(async () => {
    const api = await getGitHubAPI()
    const repositories = await api.getAllUserRepositories()
    return repositories.map(transformRepositoryData)
  })
}

// Repository filtering and sorting utilities
export const filterRepositories = (
  repositories: GitHubRepository[],
  filters: {
    language?: string
    hasDescription?: boolean
    hasReadme?: boolean
    minStars?: number
    isPrivate?: boolean
    searchTerm?: string
  }
): GitHubRepository[] => {
  return repositories.filter(repo => {
    if (filters.language && repo.language !== filters.language) {
      return false
    }

    if (filters.hasDescription && !repo.description) {
      return false
    }

    if (filters.minStars && repo.stargazers_count < filters.minStars) {
      return false
    }

    if (filters.isPrivate !== undefined && repo.private !== filters.isPrivate) {
      return false
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesName = repo.name.toLowerCase().includes(searchLower)
      const matchesDescription = repo.description?.toLowerCase().includes(searchLower)
      const matchesTopics = repo.topics?.some(topic =>
        topic.toLowerCase().includes(searchLower)
      )

      if (!matchesName && !matchesDescription && !matchesTopics) {
        return false
      }
    }

    return true
  })
}

export const sortRepositories = (
  repositories: GitHubRepository[],
  sortBy: 'name' | 'updated' | 'created' | 'stars' | 'forks' | 'priority',
  direction: 'asc' | 'desc' = 'desc'
): GitHubRepository[] => {
  const sorted = [...repositories].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'updated':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        break
      case 'created':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'stars':
        comparison = a.stargazers_count - b.stargazers_count
        break
      case 'forks':
        comparison = a.forks_count - b.forks_count
        break
      case 'priority':
        comparison = (a.priority_order || 0) - (b.priority_order || 0)
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return sorted
}

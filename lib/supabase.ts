import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on our schema
export interface UserProfile {
  id: string
  github_username: string
  github_id: number
  display_name?: string
  avatar_url?: string
  bio?: string
  goals?: string[]
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserRepository {
  id: string
  user_id: string
  github_repo_id: number
  repo_data: GitHubRepository
  priority_order: number
  user_notes?: string
  ai_analysis?: RepositoryAnalysis
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description?: string
  language?: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  created_at: string
  html_url: string
  clone_url: string
  default_branch: string
  topics: string[]
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
  // Additional fields from GitHub API
  size?: number
  open_issues_count?: number
  has_issues?: boolean
  has_projects?: boolean
  has_wiki?: boolean
  archived?: boolean
  disabled?: boolean
  pushed_at?: string
  // Custom fields for our app
  priority_order?: number
  user_notes?: string | null
  ai_analysis?: RepositoryAnalysis | null
  is_featured?: boolean
}

export interface RepositoryAnalysis {
  complexity_score: number
  tech_stack: string[]
  project_type: string
  completeness_score: number
  suggestions: string[]
  generated_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title?: string
  repository_id?: number
  messages?: ChatMessage[]
  context?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  created_at: string
  context?: {
    repository?: UserRepository
    action_type?: 'analysis' | 'suggestion' | 'generation'
  }
}

export interface GeneratedContent {
  id: string
  user_id: string
  repository_id: string
  content_type: 'readme' | 'file' | 'folder'
  content: Record<string, any>
  status: 'draft' | 'applied' | 'rejected'
  github_commit_sha?: string
  created_at: string
}

// Database helper functions
export const createUserProfile = async (userData: {
  id: string
  github_username: string
  github_id: number
  display_name?: string
  avatar_url?: string
  bio?: string
}) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([userData])
    .select()
    .single()

  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export const getUserRepositories = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_repositories')
    .select('*')
    .eq('user_id', userId)
    .order('priority_order', { ascending: true })

  return { data, error }
}

export const saveUserRepositories = async (repositories: Omit<UserRepository, 'id' | 'created_at' | 'updated_at'>[]) => {
  const { data, error } = await supabase
    .from('user_repositories')
    .upsert(repositories, { 
      onConflict: 'user_id,github_repo_id',
      ignoreDuplicates: false 
    })
    .select()

  return { data, error }
}

export const updateRepositoryOrder = async (repositoryId: string, newOrder: number) => {
  const { data, error } = await supabase
    .from('user_repositories')
    .update({ priority_order: newOrder })
    .eq('id', repositoryId)
    .select()
    .single()

  return { data, error }
}

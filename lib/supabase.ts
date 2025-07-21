import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (placeholder)
export interface User {
  id: string
  email: string
  github_username?: string
  subscription_tier: "free" | "pro" | "enterprise"
  created_at: string
}

export interface Repository {
  id: string
  user_id: string
  github_repo_id: number
  name: string
  full_name: string
  description?: string
  private: boolean
  html_url: string
  clone_url: string
  default_branch: string
  language?: string
  stars_count: number
  forks_count: number
  last_analyzed?: string
  score?: number
  status: "pending" | "analyzing" | "completed" | "error"
  created_at: string
  updated_at: string
}

export interface AnalysisResult {
  id: string
  repository_id: string
  suggestions: any[]
  readme_generated?: string
  folder_structure?: any
  security_issues?: any[]
  score: number
  created_at: string
}

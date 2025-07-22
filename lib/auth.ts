import { supabase, createUserProfile, getUserProfile } from './supabase'

export interface GitHubUser {
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  public_repos: number;
  created_at: string;
}

export interface AuthState {
  user: GitHubUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export const signInWithGitHub = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo user:email read:user',
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('GitHub OAuth error:', error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear any cached data
    localStorage.removeItem('github-repos')
    
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    if (user && user.user_metadata) {
      const githubUser: GitHubUser = {
        id: user.id,
        login: user.user_metadata.user_name || user.user_metadata.preferred_username,
        name: user.user_metadata.full_name || user.user_metadata.name,
        email: user.email || user.user_metadata.email,
        avatar_url: user.user_metadata.avatar_url,
        public_repos: user.user_metadata.public_repos || 0,
        created_at: user.created_at
      }
      
      // Check if user profile exists, create if not
      await ensureUserProfile(githubUser, user.user_metadata)
      
      return { user: githubUser, error: null }
    }
    
    return { user: null, error: null }
  } catch (error) {
    console.error('Get current user error:', error)
    return { user: null, error }
  }
}

// Helper function to ensure user profile exists
const ensureUserProfile = async (githubUser: GitHubUser, userMetadata: any) => {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await getUserProfile(githubUser.id)
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', fetchError)
      return
    }
    
    // Create profile if it doesn't exist
    if (!existingProfile) {
      const githubId = userMetadata.provider_id || userMetadata.sub || userMetadata.iss?.split('/').pop()
      
      const { error: createError } = await createUserProfile({
        id: githubUser.id,
        github_username: githubUser.login,
        github_id: parseInt(githubId) || 0,
        display_name: githubUser.name,
        avatar_url: githubUser.avatar_url,
        bio: userMetadata.bio || null
      })
      
      if (createError) {
        console.error('Error creating user profile:', createError)
      } else {
        console.log('User profile created successfully')
      }
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error)
  }
}

export const getGitHubAccessToken = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    console.log('Session debug:', {
      hasSession: !!session,
      hasProviderToken: !!session?.provider_token,
      hasProviderRefreshToken: !!session?.provider_refresh_token,
      provider: session?.user?.app_metadata?.provider
    })
    
    if (session?.provider_token) {
      return { token: session.provider_token, error: null }
    }
    
    // Try to get fresh token if we have provider_refresh_token
    if (session?.provider_refresh_token && session?.user?.app_metadata?.provider === 'github') {
      try {
        // For now, let's use a workaround - create a fresh session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError && refreshData.session?.provider_token) {
          return { token: refreshData.session.provider_token, error: null }
        }
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr)
      }
    }
    
    return { token: null, error: new Error('No GitHub access token found. Please sign in again.') }
  } catch (error) {
    console.error('Get GitHub token error:', error)
    return { token: null, error }
  }
}
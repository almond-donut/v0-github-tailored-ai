import { useState, useEffect } from 'react'

const TOKEN_STORAGE_KEY = 'github_personal_token'
const TOKEN_SETUP_COMPLETED_KEY = 'github_token_setup_completed'

export interface TokenSetupState {
  token: string | null
  isSetupCompleted: boolean
  showSetupModal: boolean
}

export function useGitHubTokenSetup() {
  const [state, setState] = useState<TokenSetupState>({
    token: null,
    isSetupCompleted: false,
    showSetupModal: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const setupCompleted = localStorage.getItem(TOKEN_SETUP_COMPLETED_KEY) === 'true'
    
    setState(prev => ({
      ...prev,
      token: savedToken,
      isSetupCompleted: setupCompleted,
      showSetupModal: !setupCompleted && !savedToken
    }))
  }, [])

  const saveToken = async (token: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate token format
      if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        throw new Error('Invalid token format. GitHub tokens should start with "ghp_" or "github_pat_"')
      }

      // Test the token by making a simple API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid token. Please check your token and try again.')
        } else if (response.status === 403) {
          throw new Error('Token does not have sufficient permissions. Please ensure you selected the required scopes.')
        } else {
          throw new Error(`Token validation failed: ${response.statusText}`)
        }
      }

      const userData = await response.json()
      
      // If we get here, the token is valid
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(TOKEN_SETUP_COMPLETED_KEY, 'true')
      
      setState(prev => ({
        ...prev,
        token,
        isSetupCompleted: true,
        showSetupModal: false
      }))

      return true
    } catch (err: any) {
      setError(err.message || 'Failed to validate token')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearToken = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(TOKEN_SETUP_COMPLETED_KEY)
    setState(prev => ({
      ...prev,
      token: null,
      isSetupCompleted: false,
      showSetupModal: true
    }))
  }

  const reopenSetup = () => {
    setState(prev => ({ ...prev, showSetupModal: true }))
    setError(null)
  }

  const closeSetupModal = () => {
    setState(prev => ({ ...prev, showSetupModal: false }))
    setError(null)
  }

  const skipSetup = () => {
    // Mark as completed but don't save token
    localStorage.setItem(TOKEN_SETUP_COMPLETED_KEY, 'true')
    setState(prev => ({
      ...prev,
      isSetupCompleted: true,
      showSetupModal: false
    }))
  }

  return {
    ...state,
    isLoading,
    error,
    saveToken,
    clearToken,
    reopenSetup,
    closeSetupModal,
    skipSetup
  }
}

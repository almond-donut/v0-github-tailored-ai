'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Github, LogOut, Settings, Plus, Star } from 'lucide-react'
import { getCurrentUser, signOut, type GitHubUser } from '@/lib/auth'
import { RepositoryService, type UserRepository } from '@/lib/repository-service'
import { supabase } from '@/lib/supabase'
import { RepositoryList } from '@/components/repository-list'
import { CompactRepositoryList } from '@/components/compact-repository-list'
import { ChatInterface } from '@/components/chat/chat-interface'
import { GitHubTokenSetupModal } from '@/components/github-token-setup-modal'
import { useGitHubTokenSetup } from '@/hooks/use-github-token-setup'

export default function Dashboard() {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repositories, setRepositories] = useState<UserRepository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const router = useRouter()
  
  // GitHub token setup
  const tokenSetup = useGitHubTokenSetup()


  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      try {
        console.log('Dashboard: Checking authentication...')
        
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setIsLoading(false)
          return
        }

        if (!session) {
          console.log('No session found, but continuing with mock user for testing')
          // Temporarily disable redirect for testing
          // setTimeout(() => {
          //   if (mounted) router.push('/')
          // }, 1000)
          // return
        }

        console.log('Session found, getting user details...')
        
        // If we have a session, get the user details
        const { user, error } = await getCurrentUser()
        
        if (!mounted) return
        
        if (error) {
          console.error('Get user error:', error)
          // Don't redirect on user error, just show loading state
          setIsLoading(false)
          return
        }
        
        if (user) {
          console.log('User loaded successfully:', user.login)
          setUser(user)
          loadRepositories(user.id)
        } else {
          console.log('No user data found, loading mock repositories')
          loadRepositories()
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Dashboard: Auth state changed:', event, !!session)
        
        if (!mounted) return
        
        // FIXED: Don't redirect on SIGNED_OUT - allow mock data to show
        if (event === 'SIGNED_IN' && session) {
          const { user } = await getCurrentUser()
          if (mounted && user) {
            setUser(user)
            loadRepositories(user.id)
            setIsLoading(false)
          }
        }
        // Removed the automatic redirect on SIGNED_OUT to allow demo mode
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const loadRepositories = async (userId?: string) => {
    setIsLoadingRepos(true)
    try {
      if (userId) {
        const repositoryService = new RepositoryService(userId)
        const repos = await repositoryService.getUserRepositories({
          includePrivate: true,
          sortBy: 'priority',
          sortDirection: 'asc'
        })
        setRepositories(repos)
      } else {
        // You can add mock data here if needed for the unauthenticated state
        setRepositories([])
      }
    } catch (error) {
      console.error('Error loading repositories:', error)
      setRepositories([])
    } finally {
      setIsLoadingRepos(false)
    }
  }

  const handleRepositoryOrderChange = async (updatedRepositories: UserRepository[]) => {
    setRepositories(updatedRepositories)
    // Here you could also call a service to persist the order change immediately
    // For now, it just updates the local state. The "Apply Changes" button in the component will handle saving.
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      router.push('/')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Temporary: Create a mock user if no user is found for testing
  const displayUser = user || {
    id: 'temp-user',
    login: 'almond-donut',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/215279882?v=4',
    public_repos: 12,
    created_at: new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Github className="h-6 w-6" />
              <span className="font-bold text-lg">GitHub Tailored AI</span>
            </div>
            <Badge variant="secondary">Dashboard</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {!tokenSetup.isSetupCompleted && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span>Token setup required</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={tokenSetup.reopenSetup}
                  className="h-6 px-2 text-xs hover:bg-amber-200"
                  data-setup-token
                >
                  Setup
                </Button>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={displayUser.avatar_url} alt={displayUser.name} />
                <AvatarFallback>{displayUser.name?.charAt(0) || displayUser.login.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{displayUser.name || displayUser.login}</p>
                <p className="text-xs text-muted-foreground">@{displayUser.login}</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={tokenSetup.reopenSetup}>
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayUser.name || displayUser.login}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to organize your GitHub repositories and make them job-ready?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
              <Github className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRepos ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  repositories.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {repositories.filter(repo => !repo.private).length} public, {repositories.filter(repo => repo.private).length} private
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organized</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRepos ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  repositories.filter(repo => repo.description && repo.description.length > 10).length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Repositories with detailed descriptions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stars</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRepos ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined stars across all repositories
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {/* Repository List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Repositories</CardTitle>
                <CardDescription>
                  Drag and drop to prioritize repositories for your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRepos ? (
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                  </div>
                ) : (
                  <CompactRepositoryList
                    repositories={repositories}
                    onChange={handleRepositoryOrderChange}
                  />
                )}
              </CardContent>
            </Card>

            {/* Getting Started Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to organize your GitHub portfolio with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Load Your Repositories</h4>
                    <p className="text-sm text-muted-foreground">
                      Import all your GitHub repositories to see what you're working with
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Organize & Prioritize</h4>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop to reorder repositories by importance for job applications
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">AI Enhancement</h4>
                    <p className="text-sm text-muted-foreground">
                      Use AI to generate READMEs, improve documentation, and clean up code structure
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Apply with Confidence</h4>
                    <p className="text-sm text-muted-foreground">
                      Present a polished, professional GitHub profile to potential employers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ChatInterface />
            </div>
          </div>
        </div>
      </main>

      {/* GitHub Token Setup Modal */}
      <GitHubTokenSetupModal
        isOpen={tokenSetup.showSetupModal}
        onClose={tokenSetup.closeSetupModal}
        onTokenSubmit={tokenSetup.saveToken}
        isLoading={tokenSetup.isLoading}
        error={tokenSetup.error}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Github, Star, GitFork, Clock, CheckCircle, AlertCircle, Zap, FileText, Settings, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Mock data for demonstration
const mockRepositories = [
  {
    id: "1",
    name: "my-portfolio",
    full_name: "username/my-portfolio",
    description: "Personal portfolio website built with Next.js",
    language: "TypeScript",
    stars_count: 12,
    forks_count: 3,
    score: 85,
    status: "completed",
    last_analyzed: "2024-01-20T10:30:00Z",
    html_url: "https://github.com/username/my-portfolio",
  },
  {
    id: "2",
    name: "todo-app",
    full_name: "username/todo-app",
    description: "Simple todo application with React",
    language: "JavaScript",
    stars_count: 5,
    forks_count: 1,
    score: 62,
    status: "analyzing",
    last_analyzed: null,
    html_url: "https://github.com/username/todo-app",
  },
  {
    id: "3",
    name: "api-server",
    full_name: "username/api-server",
    description: "RESTful API server with Node.js and Express",
    language: "JavaScript",
    stars_count: 8,
    forks_count: 2,
    score: null,
    status: "pending",
    last_analyzed: null,
    html_url: "https://github.com/username/api-server",
  },
]

export default function DashboardPage() {
  const [repositories, setRepositories] = useState(mockRepositories)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      } else {
        // For demo purposes, we'll show mock data even without auth
        // In production, you might want to redirect to login
        console.log("No authenticated user, showing demo data")
      }
    }
    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleConnectGitHub = async () => {
    setIsConnecting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "repo user",
        },
      })

      if (error) {
        console.error("OAuth error:", error)
        alert("Failed to connect to GitHub. Please try again.")
      }
    } catch (error) {
      console.error("Connection error:", error)
      alert("Failed to connect to GitHub. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleAnalyzeRepo = async (repoId: string) => {
    setRepositories((prev) =>
      prev.map((repo) => (repo.id === repoId ? { ...repo, status: "analyzing" as const } : repo)),
    )

    // Simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setRepositories((prev) =>
      prev.map((repo) =>
        repo.id === repoId
          ? {
              ...repo,
              status: "completed" as const,
              score: Math.floor(Math.random() * 40) + 60,
              last_analyzed: new Date().toISOString(),
            }
          : repo,
      ),
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "analyzing":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "analyzing":
        return <Clock className="h-4 w-4 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Repository Dashboard</h1>
            <p className="text-gray-400">Manage and optimize your GitHub repositories</p>
          </div>
          <div className="flex items-center gap-4">
            {!user && (
              <Button
                onClick={handleConnectGitHub}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Github className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect GitHub"}
              </Button>
            )}
            {user && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <Card className="bg-gray-800/30 border-gray-700/50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.user_metadata?.name || "GitHub User"}</h3>
                  <p className="text-gray-400">{user.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    Connected to GitHub
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Repositories</p>
                  <p className="text-2xl font-bold">{repositories.length}</p>
                </div>
                <Github className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Analyzed</p>
                  <p className="text-2xl font-bold">{repositories.filter((r) => r.status === "completed").length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Average Score</p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      repositories.filter((r) => r.score).reduce((acc, r) => acc + (r.score || 0), 0) /
                        repositories.filter((r) => r.score).length,
                    ) || 0}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">In Progress</p>
                  <p className="text-2xl font-bold">{repositories.filter((r) => r.status === "analyzing").length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repositories List */}
        <Card className="bg-gray-800/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Your Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="border border-gray-700/50 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(repo.status)}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{repo.name}</h3>
                        <p className="text-gray-400 text-sm">{repo.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-700/50">
                        {repo.language}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600">
                        {getStatusIcon(repo.status)}
                        <span className="ml-1 capitalize">{repo.status}</span>
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {repo.stars_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks_count}
                      </div>
                      {repo.last_analyzed && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Last analyzed: {new Date(repo.last_analyzed).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {repo.score && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Score:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={repo.score} className="w-20" />
                          <span className="text-sm font-semibold">{repo.score}/100</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {repo.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyzeRepo(repo.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                    )}
                    {repo.status === "completed" && (
                      <>
                        <Button size="sm" variant="outline" className="border-gray-600 bg-transparent">
                          <FileText className="h-4 w-4 mr-1" />
                          View Report
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 bg-transparent">
                          <Settings className="h-4 w-4 mr-1" />
                          Optimize
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-1" />
                        View on GitHub
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

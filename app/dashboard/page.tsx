"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Star, GitFork, Clock, CheckCircle, AlertCircle, Zap, FileText, LogOut } from "lucide-react"

interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  bio: string
}

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  html_url: string
  updated_at: string
  private: boolean
}

interface UserSession {
  user: GitHubUser
  repositories: GitHubRepo[]
  access_token: string
  authenticated_at: string
}

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get("success")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      setIsLoading(false)
      return
    }

    if (success === "authenticated") {
      // Fetch session data from cookie
      fetchSessionData()
    } else {
      // Check if user already has a session
      fetchSessionData()
    }
  }, [searchParams])

  const fetchSessionData = async () => {
    try {
      const response = await fetch("/api/session")
      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)
        setRepositories(sessionData.repositories || [])
      } else {
        setError("No active session found")
      }
    } catch (err) {
      console.error("Failed to fetch session:", err)
      setError("Failed to load session data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/session", { method: "DELETE" })
      setSession(null)
      setRepositories([])
      router.push("/")
    } catch (err) {
      console.error("Sign out error:", err)
    }
  }

  const handleAnalyzeRepo = async (repo: GitHubRepo) => {
    // TODO: Implement AI analysis
    console.log("Analyzing repository:", repo.name)
    alert(`Analysis for ${repo.name} will be implemented soon!`)
  }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      JavaScript: "bg-yellow-500",
      TypeScript: "bg-blue-500",
      Python: "bg-green-500",
      Java: "bg-red-500",
      "C++": "bg-purple-500",
      Go: "bg-cyan-500",
      Rust: "bg-orange-500",
      PHP: "bg-indigo-500",
    }
    return colors[language] || "bg-gray-500"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your GitHub data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <Card className="bg-red-900/20 border-red-700/50 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
              <Github className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <Card className="bg-gray-800/30 border-gray-700/50 max-w-md">
          <CardContent className="p-6 text-center">
            <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Not Authenticated</h2>
            <p className="text-gray-300 mb-4">Please connect your GitHub account to continue</p>
            <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
              <Github className="h-4 w-4 mr-2" />
              Connect GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* User Info */}
        <Card className="bg-gray-800/30 border-gray-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <img
                src={session.user.avatar_url || "/placeholder.svg"}
                alt={session.user.name || session.user.login}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h3 className="text-xl font-semibold">{session.user.name || session.user.login}</h3>
                <p className="text-gray-400">@{session.user.login}</p>
                {session.user.bio && <p className="text-gray-300 mt-1">{session.user.bio}</p>}
                <Badge variant="secondary" className="mt-2">
                  <Github className="h-3 w-3 mr-1" />
                  Connected to GitHub
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <p className="text-gray-400 text-sm">Public Repos</p>
                  <p className="text-2xl font-bold">{repositories.filter((r) => !r.private).length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Stars</p>
                  <p className="text-2xl font-bold">
                    {repositories.reduce((acc, repo) => acc + repo.stargazers_count, 0)}
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
                  <p className="text-gray-400 text-sm">Languages</p>
                  <p className="text-2xl font-bold">
                    {new Set(repositories.map((r) => r.language).filter(Boolean)).size}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repositories List */}
        <Card className="bg-gray-800/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Your Repositories ({repositories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repositories.length === 0 ? (
              <div className="text-center py-8">
                <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No repositories found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="border border-gray-700/50 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {repo.private && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                          <div>
                            <h3 className="font-semibold text-lg">{repo.name}</h3>
                            <p className="text-gray-400 text-sm">{repo.description || "No description"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {repo.language && (
                          <Badge variant="secondary" className={`${getLanguageColor(repo.language)} text-white`}>
                            {repo.language}
                          </Badge>
                        )}
                        {repo.private && (
                          <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {repo.stargazers_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="h-4 w-4" />
                          {repo.forks_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAnalyzeRepo(repo)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Analyze with AI
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 bg-transparent">
                        <FileText className="h-4 w-4 mr-1" />
                        Generate README
                      </Button>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

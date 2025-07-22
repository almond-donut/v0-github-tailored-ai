"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Github,
  Star,
  GitFork,
  Clock,
  Settings,
  LogOut,
  Plus,
  GripVertical,
  Folder,
  Code,
  FileText,
  Lightbulb,
  Send,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Square,
  Eye,
} from "lucide-react"

interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  bio: string
  public_repos: number
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

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [draggedRepo, setDraggedRepo] = useState<number | null>(null)
  const [expandedRepos, setExpandedRepos] = useState<Set<number>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [welcomeText, setWelcomeText] = useState("")
  const [isTypingWelcome, setIsTypingWelcome] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fullWelcomeText = "Welcome to your GitHub AI Assistant"

  // Typewriter effect for welcome message
  useEffect(() => {
    if (isTypingWelcome && session) {
      let index = 0
      const timer = setInterval(() => {
        if (index < fullWelcomeText.length) {
          setWelcomeText(fullWelcomeText.slice(0, index + 1))
          index++
        } else {
          setIsTypingWelcome(false)
          clearInterval(timer)
        }
      }, 50)

      return () => clearInterval(timer)
    }
  }, [isTypingWelcome, session])

  useEffect(() => {
    const success = searchParams.get("success")
    const errorParam = searchParams.get("error")
    const oauthSuccess = searchParams.get("oauth_success")

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      setIsLoading(false)
      return
    }

    if (success === "authenticated" || oauthSuccess === "true") {
      fetchSessionData()
    } else {
      fetchSessionData()
    }
  }, [searchParams])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

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

  const handleDragStart = (e: React.DragEvent, repoId: number) => {
    setDraggedRepo(repoId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedRepo === null) return

    const draggedIndex = repositories.findIndex((repo) => repo.id === draggedRepo)
    if (draggedIndex === -1) return

    const newRepositories = [...repositories]
    const [draggedItem] = newRepositories.splice(draggedIndex, 1)
    newRepositories.splice(targetIndex, 0, draggedItem)

    setRepositories(newRepositories)
    setDraggedRepo(null)
    setHasChanges(true)
  }

  const toggleRepoExpansion = (repoId: number) => {
    const newExpanded = new Set(expandedRepos)
    if (newExpanded.has(repoId)) {
      newExpanded.delete(repoId)
    } else {
      newExpanded.add(repoId)
    }
    setExpandedRepos(newExpanded)
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatMessage("")
    setIsAiThinking(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you're asking about: "${userMessage.content}". Let me analyze your repositories and provide some insights. This is a demo response - the full AI integration will be implemented soon!`,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiMessage])
      setIsAiThinking(false)
    }, 2000)
  }

  const applyChanges = () => {
    // TODO: Implement apply changes functionality
    console.log("Applying changes to repository order...")
    setHasChanges(false)
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 14) return "1 week ago"
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  const ThinkingSpinner = () => {
    const [spinnerChar, setSpinnerChar] = useState(0)
    const chars = ["|", "/", "-", "\\"]

    useEffect(() => {
      const interval = setInterval(() => {
        setSpinnerChar((prev) => (prev + 1) % chars.length)
      }, 200)

      return () => clearInterval(interval)
    }, [])

    return <span className="font-mono">{chars[spinnerChar]}</span>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your GitHub data...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">{error || "Please connect your GitHub account"}</p>
            <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
              <Github className="h-4 w-4 mr-2" />
              Connect GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const publicRepos = repositories.filter((repo) => !repo.private).length
  const privateRepos = repositories.filter((repo) => repo.private).length
  const totalStars = repositories.reduce((acc, repo) => acc + repo.stargazers_count, 0)
  const organizedRepos = repositories.filter((repo) => repo.description && repo.description.length > 20).length

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Github className="h-6 w-6" />
                <span className="text-lg font-semibold">GitHub Tailored AI</span>
              </div>
              <nav className="flex items-center space-x-6">
                <span className="font-medium">Dashboard</span>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.avatar_url || "/placeholder.svg"} alt={session.user.login} />
                  <AvatarFallback>{session.user.login.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{session.user.login}</div>
                  <div className="text-muted-foreground">@{session.user.login}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {session.user.login}! 👋</h1>
          <p className="text-muted-foreground">Ready to organize your GitHub repositories and make them job-ready?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Repositories</p>
                  <p className="text-3xl font-bold">{repositories.length}</p>
                  <p className="text-muted-foreground text-sm">
                    {publicRepos} public, {privateRepos} private
                  </p>
                </div>
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Organized</p>
                  <p className="text-3xl font-bold">{organizedRepos}</p>
                  <p className="text-muted-foreground text-sm">Repositories with detailed descriptions</p>
                </div>
                <div className="flex items-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Stars</p>
                  <p className="text-3xl font-bold">{totalStars}</p>
                  <p className="text-muted-foreground text-sm">Combined stars across all repositories</p>
                </div>
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Repositories List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Your Repositories
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Drag and drop to prioritize repositories for your portfolio
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {repositories.map((repo, index) => (
                    <div key={repo.id} className="border-b border-border last:border-b-0">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, repo.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="flex items-center p-4 hover:bg-accent/50 cursor-move transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground mr-3" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRepoExpansion(repo.id)}
                          className="p-0 h-auto mr-2 text-muted-foreground hover:text-foreground"
                        >
                          {expandedRepos.has(repo.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Folder className="h-4 w-4 text-blue-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-blue-400 hover:underline cursor-pointer">
                              {repo.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {repo.language && (
                                <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                                  {repo.language}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {repo.stargazers_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <GitFork className="h-3 w-3" />
                                {repo.forks_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(repo.updated_at)}
                              </div>
                            </div>
                          </div>
                          {repo.description && (
                            <p className="text-muted-foreground text-sm truncate">{repo.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Expanded Repository Details */}
                      {expandedRepos.has(repo.id) && (
                        <div className="bg-accent/20 p-4 border-t border-border">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Repository Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Full Name:</span>
                                  <span>{repo.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Language:</span>
                                  <span>{repo.language || "Not specified"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Visibility:</span>
                                  <span>{repo.private ? "Private" : "Public"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Updated:</span>
                                  <span>{formatTimeAgo(repo.updated_at)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Quick Actions</h4>
                              <div className="space-y-2">
                                <Button size="sm" variant="outline" className="w-full justify-start bg-transparent">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview Changes
                                </Button>
                                <Button size="sm" variant="outline" className="w-full justify-start bg-transparent">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate README
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full justify-start bg-transparent"
                                  asChild
                                >
                                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-4 w-4 mr-2" />
                                    View on GitHub
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Apply Changes Button - Only show when there are changes */}
            {hasChanges && (
              <div className="mt-4">
                <Button onClick={applyChanges} className="bg-green-600 hover:bg-green-700 w-full">
                  Apply Changes
                </Button>
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className="lg:col-span-1">
            {!isChatMinimized ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsChatMinimized(true)}
                        className="w-3 h-3 bg-yellow-500 rounded-full p-0 hover:bg-yellow-600"
                      />
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium ml-2">AI Assistant</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background rounded-lg p-4 border border-border max-h-96 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <Github className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">
                      {isTypingWelcome ? (
                        <span>
                          {welcomeText}
                          <span className="animate-pulse">|</span>
                        </span>
                      ) : (
                        welcomeText
                      )}
                    </h3>
                    {!isTypingWelcome && (
                      <p className="text-muted-foreground text-sm mb-4">
                        Ask me anything about your repositories, code structure, or get suggestions for improvements.
                      </p>
                    )}

                    {!isTypingWelcome && (
                      <div className="space-y-2 mb-4">
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Code className="h-4 w-4 mr-2" />
                          Analyze Structure
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate README
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Get Suggestions
                        </Button>
                      </div>
                    )}

                    {/* Chat Messages */}
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs p-2 rounded-lg text-sm ${
                              message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-accent text-foreground border border-border"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                      {isAiThinking && (
                        <div className="flex justify-start">
                          <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm flex items-center gap-2">
                            <ThinkingSpinner />
                            <span>AI is thinking...</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAiThinking(false)}
                              className="p-0 h-auto ml-2"
                            >
                              <Square className="h-3 w-3 text-red-500 fill-current" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  {!isTypingWelcome && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask about your repositories..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="bg-background border-border"
                        />
                        {chatMessage.trim() && (
                          <Button onClick={handleSendMessage} size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Minimized Chat Bubble */
              <div className="fixed bottom-6 right-6 z-50">
                <Button
                  onClick={() => setIsChatMinimized(false)}
                  className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

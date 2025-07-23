"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase"
import {
  Github,
  Star,
  TrendingUp,
  Zap,
  Shield,
  FileText,
  GitBranch,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react"

export default function HomePage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const searchParams = useSearchParams()

  const initializeDebugInfo = useCallback(() => {
    if (typeof window !== "undefined") {
      return {
        currentUrl: window.location.href,
        origin: window.location.origin,
        clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        callbackUrl: `${window.location.origin}/api/github/callback`,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    }
    return null
  }, [])

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error")
    const oauthSuccess = searchParams.get("oauth_success")

    if (oauthError) {
      setError(`OAuth Error: ${decodeURIComponent(oauthError)}`)
      console.error("OAuth Error from URL:", oauthError)
    }

    if (oauthSuccess && !isRedirecting) {
      console.log("OAuth Success detected, redirecting to dashboard...")
      setIsRedirecting(true)
      const timer = setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)

      return () => clearTimeout(timer)
    }

    if (!debugInfo) {
      setDebugInfo(initializeDebugInfo())
    }
  }, [searchParams, isRedirecting, debugInfo, initializeDebugInfo])

  const handleGitHubConnect = useCallback(async () => {
    if (isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      console.log("🚀 === STARTING SUPABASE GITHUB OAUTH FLOW ===")

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'repo user'
        }
      })

      if (error) {
        console.error("❌ Supabase OAuth error:", error)
        throw error
      }

      console.log("✅ OAuth initiated successfully:", data)
      
      // The redirect will happen automatically
      setIsRedirecting(true)
    } catch (error) {
      console.error("❌ OAuth initiation failed:", error)
      setError(`Failed to start OAuth: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsConnecting(false)
    }
  }, [isConnecting])

  const dismissError = useCallback(() => {
    setError(null)
    const url = new URL(window.location.href)
    url.searchParams.delete("oauth_error")
    url.searchParams.delete("oauth_success")
    window.history.replaceState({}, document.title, url.pathname)
  }, [])

  const testCallback = useCallback(() => {
    const testUrl = `${window.location.origin}/api/github/callback?test=true`
    console.log("🧪 Testing callback URL:", testUrl)
    window.open(testUrl, "_blank")
  }, [])

  const openDebugPage = useCallback(() => {
    window.open("/debug", "_blank")
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert className="bg-destructive/20 border-destructive text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="pr-8">{error}</AlertDescription>
            <button
              onClick={dismissError}
              className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      {/* Success Alert */}
      {isRedirecting && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert className="bg-green-500/20 border-green-500 text-green-500 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                OAuth successful! Redirecting to dashboard...
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="h-8 w-8" />
            <span className="text-xl font-bold">GitHub Tailored AI</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Beta
            </Badge>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </a>
            <a href="/debug" className="text-muted-foreground hover:text-foreground transition-colors">
              Debug
            </a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Github className="h-16 w-16 mx-auto mb-6" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">Your personal AI assistant to manage your projects</h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Excited that you've created tons of projects, but it's a mess...
          </p>

          <p className="text-lg text-muted-foreground mb-12">We're here to help.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={handleGitHubConnect}
              disabled={isConnecting || isRedirecting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold disabled:opacity-50"
            >
              <Github className="h-5 w-5 mr-2" />
              {isConnecting ? "Connecting..." : isRedirecting ? "Redirecting..." : "Connect GitHub"}
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg bg-transparent">
              Watch Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Debug Section - Only show in development */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔧 Debug Information</CardTitle>
              </CardHeader>
              <CardContent className="text-left">
                <div className="grid md:grid-cols-2 gap-4 text-sm space-y-2">
                  <div>
                    <strong>GitHub Client ID:</strong>{" "}
                    <span
                      className={
                        debugInfo.clientId ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }
                    >
                      {debugInfo.clientId ? "✅ Set" : "❌ Missing"}
                    </span>
                  </div>
                  <div>
                    <strong>Current URL:</strong> <code className="text-xs break-all">{debugInfo.currentUrl}</code>
                  </div>
                  <div>
                    <strong>Callback URL:</strong> <code className="text-xs break-all">{debugInfo.callbackUrl}</code>
                  </div>
                  <div>
                    <strong>Environment:</strong> {process.env.NODE_ENV}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={testCallback} variant="outline" className="text-xs bg-transparent">
                    Test Callback URL
                  </Button>
                  <Button size="sm" onClick={openDebugPage} variant="outline" className="text-xs bg-transparent">
                    Open Debug Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social Proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-muted-foreground">developers hired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5,000+</div>
              <div className="text-muted-foreground">repos cleaned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-muted-foreground">job success rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-accent/20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need to land your dream job</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your messy GitHub into a professional portfolio that recruiters love
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Get instant insights on your repository structure, code quality, and documentation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 mb-2" />
              <CardTitle>Smart README Generation</CardTitle>
              <CardDescription>
                Automatically generate professional README files that showcase your projects effectively
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-8 w-8 mb-2" />
              <CardTitle>Repository Organization</CardTitle>
              <CardDescription>
                Reorganize your folders and files with AI suggestions for better maintainability
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2" />
              <CardTitle>Security Scanning</CardTitle>
              <CardDescription>Identify and fix security vulnerabilities before they become a problem</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2" />
              <CardTitle>Portfolio Scoring</CardTitle>
              <CardDescription>
                Get a comprehensive score for each repository and track your improvement over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 mb-2" />
              <CardTitle>Job-Ready Optimization</CardTitle>
              <CardDescription>
                Tailor your repositories for specific job applications and industry standards
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Loved by developers worldwide</h2>
          <p className="text-xl text-muted-foreground">See what our users have to say</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "GitHub Tailored AI helped me land my first developer job! The AI suggestions were spot-on."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  S
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-sm text-muted-foreground">Frontend Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "My GitHub went from a mess to a professional portfolio in just one day. Amazing!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  M
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Marcus Johnson</div>
                  <div className="text-sm text-muted-foreground">Full Stack Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "The AI-generated READMEs are better than what I could write myself. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  A
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Alex Rivera</div>
                  <div className="text-sm text-muted-foreground">Backend Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 bg-accent/20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your GitHub?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers who've already landed their dream jobs with our help
          </p>
          <Button
            size="lg"
            onClick={handleGitHubConnect}
            disabled={isConnecting || isRedirecting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 text-xl font-semibold disabled:opacity-50"
          >
            <Github className="h-6 w-6 mr-3" />
            {isConnecting ? "Connecting..." : isRedirecting ? "Redirecting..." : "Start Free Today"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Github className="h-6 w-6" />
                <span className="text-lg font-bold">GitHub Tailored AI</span>
              </div>
              <p className="text-muted-foreground">
                Transform your GitHub into a job-winning portfolio with AI-powered optimization.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-foreground transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 GitHub Tailored AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

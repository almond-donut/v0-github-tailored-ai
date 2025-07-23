"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, ArrowLeft, Settings, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setIsLoading(true)
    const info: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {},
    }

    try {
      // Test 1: Environment Variables
      info.tests.envVars = {
        name: "Environment Variables",
        status: "success",
        details: {
          githubClientId: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          clientIdValue: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID?.substring(0, 10) + "...",
          nodeEnv: process.env.NODE_ENV,
        },
      }

      // Test 2: URLs
      info.tests.urls = {
        name: "URL Configuration",
        status: "success",
        details: {
          currentOrigin: window.location.origin,
          callbackUrl: `${window.location.origin}/api/github/callback`,
          githubAuthUrl: `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`,
        },
      }

      // Test 3: Session API
      try {
        const sessionResponse = await fetch("/api/session")
        info.tests.sessionApi = {
          name: "Session API",
          status: sessionResponse.ok ? "success" : "warning",
          details: {
            status: sessionResponse.status,
            statusText: sessionResponse.statusText,
            hasSession: sessionResponse.status === 200,
          },
        }
      } catch (err) {
        info.tests.sessionApi = {
          name: "Session API",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Unknown error" },
        }
      }

      // Test 4: GitHub API Connectivity
      try {
        const githubResponse = await fetch("https://api.github.com/", { method: "HEAD" })
        info.tests.githubApi = {
          name: "GitHub API Connectivity",
          status: githubResponse.ok ? "success" : "error",
          details: {
            status: githubResponse.status,
            accessible: githubResponse.ok,
          },
        }
      } catch (err) {
        info.tests.githubApi = {
          name: "GitHub API Connectivity",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Network error" },
        }
      }

      // Test 5: Browser Environment
      info.tests.browser = {
        name: "Browser Environment",
        status: "success",
        details: {
          localStorage: typeof localStorage !== "undefined",
          sessionStorage: typeof sessionStorage !== "undefined",
          cookies: typeof document !== "undefined",
          https: window.location.protocol === "https:" || window.location.hostname === "localhost",
          userAgent: navigator.userAgent.substring(0, 50) + "...",
        },
      }

      setDebugInfo(info)
    } catch (error) {
      console.error("Diagnostics error:", error)
      info.tests.diagnosticsError = {
        name: "Diagnostics Error",
        status: "error",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      }
      setDebugInfo(info)
    } finally {
      setIsLoading(false)
    }
  }

  const testGitHubOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23liaOcBS8zuFJCGyG"
    const redirectUri = `${window.location.origin}/api/github/callback`
    const scope = "repo user"
    const state = `debug_test_${Date.now()}`

    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
    githubAuthUrl.searchParams.set("client_id", clientId)
    githubAuthUrl.searchParams.set("redirect_uri", redirectUri)
    githubAuthUrl.searchParams.set("scope", scope)
    githubAuthUrl.searchParams.set("state", state)

    console.log("🧪 Testing GitHub OAuth with URL:", githubAuthUrl.toString())
    window.open(githubAuthUrl.toString(), "_blank")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-500/50 bg-green-900/20"
      case "warning":
        return "border-yellow-500/50 bg-yellow-900/20"
      case "error":
        return "border-red-500/50 bg-red-900/20"
      default:
        return "border-gray-500/50 bg-gray-900/20"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔧 Debug Dashboard</h1>
            <p className="text-gray-400">Troubleshoot GitHub OAuth issues</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <Button onClick={testGitHubOAuth} className="w-full bg-purple-600 hover:bg-purple-700">
                <Github className="h-4 w-4 mr-2" />
                Test GitHub OAuth (New Tab)
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <Button onClick={runDiagnostics} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                <Settings className="h-4 w-4 mr-2" />
                {isLoading ? "Running..." : "Refresh Diagnostics"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <Button
                onClick={() => window.open("https://github.com/settings/applications", "_blank")}
                variant="outline"
                className="w-full border-gray-600 bg-transparent"
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub OAuth Apps
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Diagnostics Results */}
        {debugInfo && (
          <div className="space-y-6">
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardHeader>
                <CardTitle>📊 System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Timestamp:</strong> {new Date(debugInfo.timestamp).toLocaleString()}
                  </div>
                  <div>
                    <strong>Environment:</strong> {debugInfo.environment}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <div className="grid gap-4">
              {Object.entries(debugInfo.tests).map(([key, test]: [string, any]) => (
                <Card key={key} className={`${getStatusColor(test.status)} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        {test.name}
                      </h4>
                      <Badge variant={test.status === "success" ? "default" : "destructive"}>
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-2">
                      {Object.entries(test.details).map(([detailKey, value]: [string, any]) => (
                        <div key={detailKey} className="flex justify-between items-center">
                          <span className="text-gray-400">{detailKey}:</span>
                          <span
                            className={`font-mono text-xs ${
                              typeof value === "boolean" ? (value ? "text-green-400" : "text-red-400") : "text-gray-300"
                            }`}
                          >
                            {typeof value === "boolean" ? (value ? "✅ Yes" : "❌ No") : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Common Issues */}
        <Card className="bg-gray-800/30 border-gray-700/50 mt-8">
          <CardHeader>
            <CardTitle>🚨 Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-400">Blank White Page After OAuth</h4>
              <p className="text-sm text-gray-300">
                Usually caused by callback URL mismatch. Check that your GitHub OAuth App callback URL is exactly:{" "}
                <code className="bg-gray-700 px-1 rounded">
                  {typeof window !== "undefined" ? `${window.location.origin}/api/github/callback` : ""}
                </code>
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-yellow-400">OAuth App Not Found</h4>
              <p className="text-sm text-gray-300">
                Make sure your GitHub OAuth App exists and the Client ID matches your environment variable
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-400">CORS or Network Issues</h4>
              <p className="text-sm text-gray-300">
                Check browser console for errors and ensure you're not blocking GitHub API requests
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

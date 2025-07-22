"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, ArrowLeft, Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function TestCallbackPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runCallbackTest = async () => {
    setIsLoading(true)
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    }

    try {
      // Test 1: Basic callback endpoint
      console.log("🧪 Testing callback endpoint...")
      try {
        const response = await fetch("/api/github/callback?test=true")
        results.tests.callbackEndpoint = {
          name: "Callback Endpoint",
          status: response.ok ? "success" : "error",
          details: {
            status: response.status,
            statusText: response.statusText,
            accessible: response.ok,
          },
        }
      } catch (err) {
        results.tests.callbackEndpoint = {
          name: "Callback Endpoint",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Unknown error" },
        }
      }

      // Test 2: Environment variables
      results.tests.environment = {
        name: "Environment Variables",
        status: "success",
        details: {
          clientId: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          nodeEnv: process.env.NODE_ENV,
          origin: window.location.origin,
        },
      }

      // Test 3: Session API
      try {
        const sessionResponse = await fetch("/api/session")
        results.tests.sessionApi = {
          name: "Session API",
          status: sessionResponse.status === 401 ? "success" : "warning", // 401 is expected when no session
          details: {
            status: sessionResponse.status,
            statusText: sessionResponse.statusText,
            working: sessionResponse.status === 401 || sessionResponse.status === 200,
          },
        }
      } catch (err) {
        results.tests.sessionApi = {
          name: "Session API",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Unknown error" },
        }
      }

      // Test 4: GitHub OAuth URL generation
      try {
        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23liaOcBS8zuFJCGyG"
        const redirectUri = `${window.location.origin}/api/github/callback`
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo%20user`

        results.tests.oauthUrl = {
          name: "OAuth URL Generation",
          status: "success",
          details: {
            clientId: clientId.substring(0, 10) + "...",
            redirectUri,
            fullUrl: githubUrl.substring(0, 100) + "...",
          },
        }
      } catch (err) {
        results.tests.oauthUrl = {
          name: "OAuth URL Generation",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Unknown error" },
        }
      }

      setTestResults(results)
    } catch (error) {
      console.error("Test error:", error)
      results.tests.testError = {
        name: "Test Execution",
        status: "error",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      }
      setTestResults(results)
    } finally {
      setIsLoading(false)
    }
  }

  const testOAuthFlow = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23liaOcBS8zuFJCGyG"
    const redirectUri = `${window.location.origin}/api/github/callback`
    const scope = "repo user"
    const state = `test_${Date.now()}`

    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
    githubAuthUrl.searchParams.set("client_id", clientId)
    githubAuthUrl.searchParams.set("redirect_uri", redirectUri)
    githubAuthUrl.searchParams.set("scope", scope)
    githubAuthUrl.searchParams.set("state", state)

    console.log("🧪 Testing OAuth flow with URL:", githubAuthUrl.toString())
    window.location.href = githubAuthUrl.toString()
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
            <h1 className="text-3xl font-bold mb-2">🧪 Callback Test Page</h1>
            <p className="text-gray-400">Test GitHub OAuth callback functionality</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Test Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-400" />
                Run Callback Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Test all callback-related functionality without OAuth</p>
              <Button onClick={runCallbackTest} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Running Tests..." : "Run Tests"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5 text-purple-400" />
                Test Full OAuth Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Test the complete GitHub OAuth flow (will redirect)</p>
              <Button onClick={testOAuthFlow} className="w-full bg-purple-600 hover:bg-purple-700">
                <Github className="h-4 w-4 mr-2" />
                Test OAuth Flow
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-4">
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardHeader>
                <CardTitle>📊 Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-400 mb-4">
                  Last run: {new Date(testResults.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {Object.entries(testResults.tests).map(([key, test]: [string, any]) => (
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
                  <div className="text-sm space-y-1">
                    {Object.entries(test.details).map(([detailKey, value]: [string, any]) => (
                      <div key={detailKey} className="flex justify-between items-center">
                        <span className="text-gray-400">{detailKey}:</span>
                        <span
                          className={`font-mono text-xs ${
                            typeof value === "boolean" ? (value ? "text-green-400" : "text-red-400") : "text-gray-300"
                          }`}
                        >
                          {typeof value === "boolean" ? (value ? "✅" : "❌") : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-gray-800/30 border-gray-700/50 mt-8">
          <CardHeader>
            <CardTitle>📝 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-400">Step 1: Run Callback Tests</h4>
              <p className="text-sm text-gray-300">
                This will test if your callback endpoint is working and all environment variables are set correctly.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-purple-400">Step 2: Test OAuth Flow</h4>
              <p className="text-sm text-gray-300">
                This will redirect you to GitHub OAuth. If successful, you should be redirected back to the dashboard.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-400">Step 3: Check Console Logs</h4>
              <p className="text-sm text-gray-300">
                Open browser developer tools and check the console for detailed logs during the OAuth process.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

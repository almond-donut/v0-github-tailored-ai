"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export function OAuthDebug() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    }

    try {
      // Test 1: Environment Variables
      results.tests.envVars = {
        name: "Environment Variables",
        status: "success",
        details: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
        },
      }

      // Test 2: Supabase Connection
      try {
        const { data, error } = await supabase.auth.getSession()
        results.tests.supabaseConnection = {
          name: "Supabase Connection",
          status: error ? "error" : "success",
          details: {
            connected: !error,
            session: !!data.session,
            error: error?.message,
          },
        }
      } catch (err) {
        results.tests.supabaseConnection = {
          name: "Supabase Connection",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Unknown error" },
        }
      }

      // Test 3: GitHub OAuth Configuration
      try {
        // This will fail but we can catch the error to see if OAuth is configured
        await supabase.auth.signInWithOAuth({
          provider: "github",
          options: { redirectTo: "test" },
        })
      } catch (err: any) {
        results.tests.githubOAuth = {
          name: "GitHub OAuth Setup",
          status: err.message?.includes("not enabled") ? "error" : "warning",
          details: {
            configured: !err.message?.includes("not enabled"),
            error: err.message,
          },
        }
      }

      // Test 4: Network Connectivity
      try {
        const response = await fetch("https://api.github.com/", { method: "HEAD" })
        results.tests.networkConnectivity = {
          name: "Network Connectivity",
          status: response.ok ? "success" : "error",
          details: {
            githubApi: response.ok,
            status: response.status,
          },
        }
      } catch (err) {
        results.tests.networkConnectivity = {
          name: "Network Connectivity",
          status: "error",
          details: { error: err instanceof Error ? err.message : "Network error" },
        }
      }

      // Test 5: Browser Environment
      results.tests.browserEnv = {
        name: "Browser Environment",
        status: "success",
        details: {
          localStorage: typeof localStorage !== "undefined",
          sessionStorage: typeof sessionStorage !== "undefined",
          cookies: typeof document !== "undefined" && document.cookie !== undefined,
          https: window.location.protocol === "https:" || window.location.hostname === "localhost",
        },
      }

      setTestResults(results)
    } catch (error) {
      console.error("Diagnostics error:", error)
      results.tests.diagnosticsError = {
        name: "Diagnostics Error",
        status: "error",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      }
      setTestResults(results)
    } finally {
      setIsLoading(false)
    }
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
        return <RefreshCw className="h-4 w-4 text-gray-400" />
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
    <Card className="bg-gray-800/30 border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          OAuth Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            "Run OAuth Diagnostics"
          )}
        </Button>

        {testResults && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400">Last run: {new Date(testResults.timestamp).toLocaleString()}</div>

            {Object.entries(testResults.tests).map(([key, test]: [string, any]) => (
              <Card key={key} className={`${getStatusColor(test.status)} border`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
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
                      <div key={detailKey} className="flex justify-between">
                        <span className="text-gray-400">{detailKey}:</span>
                        <span className={typeof value === "boolean" ? (value ? "text-green-400" : "text-red-400") : ""}>
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
      </CardContent>
    </Card>
  )
}

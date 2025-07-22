"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OAuthDebug } from "@/components/oauth-debug"
import { supabase } from "@/lib/supabase"
import { Github, ArrowLeft, Database, Key, Settings } from "lucide-react"
import Link from "next/link"

export default function DebugPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [supabaseHealth, setSupabaseHealth] = useState<any>(null)

  useEffect(() => {
    checkAuthState()
    checkSupabaseHealth()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      setAuthState({
        session: data.session,
        user: data.session?.user,
        error: error?.message,
      })
    } catch (err) {
      setAuthState({
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const checkSupabaseHealth = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("count").limit(1)
      setSupabaseHealth({
        connected: !error,
        tablesExist: !error,
        error: error?.message,
      })
    } catch (err) {
      setSupabaseHealth({
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const testGitHubOAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/debug`,
          scopes: "repo user",
        },
      })

      if (error) {
        alert(`OAuth Error: ${error.message}`)
      }
    } catch (err) {
      alert(`OAuth Test Failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const clearAuth = async () => {
    await supabase.auth.signOut()
    setAuthState(null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔧 Debug Dashboard</h1>
            <p className="text-gray-400">Troubleshoot GitHub OAuth and Supabase issues</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Environment Check */}
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>NEXT_PUBLIC_SUPABASE_URL</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>NEXT_PUBLIC_GEMINI_API_KEY</span>
                <Badge variant={process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "✅ Set" : "❌ Missing"}
                </Badge>
              </div>
              {process.env.NEXT_PUBLIC_SUPABASE_URL && (
                <div className="text-sm text-gray-400 mt-2">
                  <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auth State */}
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-400" />
                Authentication State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {authState ? (
                <>
                  <div className="flex justify-between items-center">
                    <span>Session</span>
                    <Badge variant={authState.session ? "default" : "destructive"}>
                      {authState.session ? "✅ Active" : "❌ None"}
                    </Badge>
                  </div>
                  {authState.user && (
                    <>
                      <div className="text-sm">
                        <strong>User:</strong> {authState.user.email}
                      </div>
                      <div className="text-sm">
                        <strong>Provider:</strong> {authState.user.app_metadata?.provider || "Unknown"}
                      </div>
                      <div className="text-sm">
                        <strong>GitHub:</strong> {authState.user.user_metadata?.user_name || "Not connected"}
                      </div>
                    </>
                  )}
                  {authState.error && (
                    <div className="text-sm text-red-400">
                      <strong>Error:</strong> {authState.error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={checkAuthState}>
                      Refresh
                    </Button>
                    {authState.session && (
                      <Button size="sm" variant="destructive" onClick={clearAuth}>
                        Sign Out
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div>Loading auth state...</div>
              )}
            </CardContent>
          </Card>

          {/* Supabase Health */}
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-400" />
                Supabase Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supabaseHealth ? (
                <>
                  <div className="flex justify-between items-center">
                    <span>Connection</span>
                    <Badge variant={supabaseHealth.connected ? "default" : "destructive"}>
                      {supabaseHealth.connected ? "✅ Connected" : "❌ Failed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tables</span>
                    <Badge variant={supabaseHealth.tablesExist ? "default" : "destructive"}>
                      {supabaseHealth.tablesExist ? "✅ Exist" : "❌ Missing"}
                    </Badge>
                  </div>
                  {supabaseHealth.error && (
                    <div className="text-sm text-red-400">
                      <strong>Error:</strong> {supabaseHealth.error}
                    </div>
                  )}
                  <Button size="sm" onClick={checkSupabaseHealth}>
                    Refresh
                  </Button>
                </>
              ) : (
                <div>Checking Supabase health...</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={testGitHubOAuth} className="w-full">
                <Github className="h-4 w-4 mr-2" />
                Test GitHub OAuth
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-600 bg-transparent"
                onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
              >
                <Database className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-600 bg-transparent"
                onClick={() => window.open("https://github.com/settings/applications", "_blank")}
              >
                <Settings className="h-4 w-4 mr-2" />
                GitHub OAuth Apps
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Diagnostics */}
        <div className="mt-8">
          <OAuthDebug />
        </div>

        {/* Common Issues */}
        <Card className="bg-gray-800/30 border-gray-700/50 mt-8">
          <CardHeader>
            <CardTitle>🚨 Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-400">OAuth Provider Not Enabled</h4>
              <p className="text-sm text-gray-300">
                Go to Supabase Dashboard → Authentication → Providers → Enable GitHub OAuth
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-yellow-400">Redirect URI Mismatch</h4>
              <p className="text-sm text-gray-300">
                GitHub OAuth App redirect URI should be: <code>https://your-project.supabase.co/auth/v1/callback</code>
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-400">Environment Variables</h4>
              <p className="text-sm text-gray-300">
                Make sure your <code>.env.local</code> file has all required variables and restart your dev server
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-400">Database Tables Missing</h4>
              <p className="text-sm text-gray-300">
                Run the SQL script in <code>scripts/create-tables.sql</code> in your Supabase SQL editor
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

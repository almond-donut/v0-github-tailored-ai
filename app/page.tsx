"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Github,
  Star,
  Users,
  TrendingUp,
  Zap,
  Shield,
  FileText,
  GitBranch,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user)
        window.location.href = "/dashboard"
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGitHubConnect = async () => {
    setIsConnecting(true)

    // Debug: Log environment variables (without exposing secrets)
    console.log("🔍 Debug Info:", {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set ✅" : "Missing ❌",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set ✅" : "Missing ❌",
      currentUrl: window.location.origin,
    })

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "repo user",
        },
      })

      console.log("🔗 OAuth Response:", { data, error })

      if (error) {
        console.error("❌ OAuth error:", error)
        alert(`GitHub connection failed: ${error.message}`)
      }
    } catch (error) {
      console.error("❌ Connection error:", error)
      alert(`Failed to connect to GitHub: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold">GitHub Tailored AI</span>
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              Beta
            </Badge>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            {user ? (
              <Button
                asChild
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 bg-transparent"
              >
                <a href="/dashboard">Dashboard</a>
              </Button>
            ) : (
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 relative">
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 rounded-full animate-bounce opacity-60"></div>
            <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-pink-500 rounded-full animate-pulse opacity-40"></div>
            <Github className="h-16 w-16 mx-auto mb-6 text-purple-400 animate-float" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Your personal AI assistant to manage your projects
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            Excited that you've created tons of projects, but it's a mess...
          </p>

          <p className="text-lg text-purple-300 mb-12 flex items-center justify-center gap-2">
            We're here to help. <Sparkles className="h-5 w-5" />
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={handleGitHubConnect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <Github className="h-5 w-5 mr-2" />
              {isConnecting ? "Connecting..." : "Connect GitHub"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg bg-transparent"
            >
              Watch Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Debug Section - Remove in production */}
          {process.env.NODE_ENV === "development" && (
            <Card className="bg-red-900/20 border-red-700/50 mb-8">
              <CardContent className="p-4">
                <h3 className="text-red-400 font-semibold mb-2">🔧 Debug Info (Development Only)</h3>
                <div className="text-sm space-y-1">
                  <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</div>
                  <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</div>
                  <div>Current URL: {typeof window !== "undefined" ? window.location.origin : "Server-side"}</div>
                  <div>User State: {user ? `✅ Authenticated (${user.email})` : "❌ Not authenticated"}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social Proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">1,247</div>
              <div className="text-gray-400">developers hired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">5,000+</div>
              <div className="text-gray-400">repos cleaned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">94%</div>
              <div className="text-gray-400">job success rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">See it in action</h2>
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="bg-black rounded-lg p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-4 text-gray-400">Terminal</span>
                </div>
                <div className="space-y-2">
                  <div className="text-green-400">$ github-ai analyze my-portfolio</div>
                  <div className="text-gray-300">🔍 Analyzing repository structure...</div>
                  <div className="text-gray-300">📝 Generating README improvements...</div>
                  <div className="text-gray-300">🎯 Optimizing for job applications...</div>
                  <div className="text-purple-400">✨ Analysis complete! Score: 94/100</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need to land your dream job</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your messy GitHub into a professional portfolio that recruiters love
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-400 mb-2" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Get instant insights on your repository structure, code quality, and documentation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle>Smart README Generation</CardTitle>
              <CardDescription>
                Automatically generate professional README files that showcase your projects effectively
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <GitBranch className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle>Repository Organization</CardTitle>
              <CardDescription>
                Reorganize your folders and files with AI suggestions for better maintainability
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <Shield className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle>Security Scanning</CardTitle>
              <CardDescription>Identify and fix security vulnerabilities before they become a problem</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-pink-400 mb-2" />
              <CardTitle>Portfolio Scoring</CardTitle>
              <CardDescription>
                Get a comprehensive score for each repository and track your improvement over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-green-400 mb-2" />
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
          <p className="text-xl text-gray-400">See what our users have to say</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "GitHub Tailored AI helped me land my first developer job! The AI suggestions were spot-on."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-sm text-gray-400">Frontend Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "My GitHub went from a mess to a professional portfolio in just one day. Amazing!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Marcus Johnson</div>
                  <div className="text-sm text-gray-400">Full Stack Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "The AI-generated READMEs are better than what I could write myself. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Alex Rivera</div>
                  <div className="text-sm text-gray-400">Backend Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Choose your plan</h2>
          <p className="text-xl text-gray-400">Start free, upgrade when you need more</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold">
                $0<span className="text-lg font-normal text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />3 repository analyses per month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Basic README generation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Portfolio scoring
                </li>
              </ul>
              <Button className="w-full bg-transparent" variant="outline">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-purple-900/50 to-pink-900/50 border-purple-500/50 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For serious developers</CardDescription>
              <div className="text-3xl font-bold">
                $19<span className="text-lg font-normal text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Unlimited repository analyses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Advanced AI suggestions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Custom README templates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Priority support
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <CardDescription>For teams and organizations</CardDescription>
              <div className="text-3xl font-bold">
                $99<span className="text-lg font-normal text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Everything in Pro
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Team collaboration
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Custom integrations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Dedicated support
                </li>
              </ul>
              <Button className="w-full bg-transparent" variant="outline">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Target Audience */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Perfect for every developer</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-gray-800/30 border-gray-700/50 text-center">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">New Graduates</h3>
              <p className="text-gray-400">Make your first impression count with a polished GitHub profile</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Career Switchers</h3>
              <p className="text-gray-400">Showcase your new skills and transition into tech successfully</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 text-center">
            <CardContent className="p-6">
              <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Experienced Devs</h3>
              <p className="text-gray-400">Optimize your portfolio for senior roles and leadership positions</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-700/50 text-center">
            <CardContent className="p-6">
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Freelancers</h3>
              <p className="text-gray-400">Build trust with clients through professional project presentations</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your GitHub?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of developers who've already landed their dream jobs with our help
          </p>
          <Button
            size="lg"
            onClick={handleGitHubConnect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-xl font-semibold"
          >
            <Github className="h-6 w-6 mr-3" />
            {isConnecting ? "Connecting..." : "Start Free Today"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Github className="h-6 w-6 text-purple-400" />
                <span className="text-lg font-bold">GitHub Tailored AI</span>
              </div>
              <p className="text-gray-400">
                Transform your GitHub into a job-winning portfolio with AI-powered optimization.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GitHub Tailored AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

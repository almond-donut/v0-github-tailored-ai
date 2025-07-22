"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Github,
  Sparkles,
  FolderTree,
  MessageSquare,
  FileText,
  GitPullRequest,
  Zap,
  Terminal,
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  Trophy,
  Clock,
  Shield,
} from "lucide-react"
import { signInWithGitHub, getCurrentUser, type GitHubUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [demoStep, setDemoStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        console.log('HomePage: Checking authentication...')
        const { user, error } = await getCurrentUser()
        
        if (error) {
          console.error('HomePage: Auth check error:', error)
          return
        }
        
        if (user) {
          console.log('HomePage: User found, redirecting to dashboard:', user.login)
          setUser(user)
          router.push('/dashboard')
        } else {
          console.log('HomePage: No user found')
        }
      } catch (err) {
        console.error('HomePage: Auth check failed:', err)
      }
    }
    checkAuth()
  }, [router])

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await signInWithGitHub()
      if (error) {
        setError(error.message || 'Failed to authenticate with GitHub')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: MessageSquare,
      title: "AI Chatbot",
      description: "Chat directly about your projects like a personal assistant",
    },
    {
      icon: FolderTree,
      title: "Repo Visualizer",
      description: "View all files/folders in tree view with drag & drop",
    },
    {
      icon: FileText,
      title: "Code Summarizer",
      description: "AI reads your files and provides summaries",
    },
    {
      icon: Zap,
      title: "Generate Structure",
      description: "Create folders and files with AI commands",
    },
    {
      icon: GitPullRequest,
      title: "PR Generator",
      description: "Auto-generate commits and pull requests",
    },
    {
      icon: Github,
      title: "GitHub OAuth",
      description: "Login directly and manage all your repositories",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Frontend Developer",
      company: "Shopify",
      content: "Got 3 interview calls after cleaning my GitHub with this tool. The AI suggestions were spot-on!",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Marcus Johnson",
      role: "Full Stack Developer",
      company: "Stripe",
      content: "Saved me 10+ hours of manual organization. The README generator alone is worth the subscription.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Elena Rodriguez",
      role: "Backend Engineer",
      company: "Netflix",
      content: "Finally my repos look professional. Recruiters actually started reaching out to me!",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const demoSteps = [
    {
      command: "$ ai organize my-portfolio",
      responses: [
        "🔍 Analyzing repository structure...",
        "📁 Creating /docs folder",
        "📝 Generating comprehensive README.md",
        "🗂️ Organizing components/ directory",
        "✨ Adding proper TypeScript types",
        "🎨 Standardizing code formatting",
      ],
    },
    {
      command: "$ ai generate readme --detailed",
      responses: [
        "📖 Analyzing project dependencies...",
        "🖼️ Generating project screenshots",
        "📋 Creating installation guide",
        "🚀 Adding deployment instructions",
        "🧪 Documenting testing procedures",
        "✅ README.md generated successfully!",
      ],
    },
    {
      command: "$ ai audit security",
      responses: [
        "🔒 Scanning for security vulnerabilities...",
        "📦 Checking outdated dependencies",
        "🔑 Reviewing API key exposure",
        "⚠️ Found 3 issues, generating fixes...",
        "✅ Security audit complete",
        "📊 Repository score: 94/100",
      ],
    },
  ]

  // Floating animation component
  const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 1, -1, 0],
      }}
      transition={{
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        delay,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )

  // Animated section component
  const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const ref = React.useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  // Demo terminal component
  const DemoTerminal = () => {
    React.useEffect(() => {
      const interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % demoSteps.length)
      }, 4000)
      return () => clearInterval(interval)
    }, [])

    return (
      <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <Terminal className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">AI Assistant</span>
        </div>
        <div className="space-y-2">
          <div className="text-green-400">{demoSteps[demoStep].command}</div>
          {demoSteps[demoStep].responses.map((response, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.3 }}
              className="text-gray-300"
            >
              {response}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-mono overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div style={{ y }} className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl" />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]) }}
          className="absolute top-40 right-20 w-48 h-48 bg-pink-500/10 rounded-full blur-xl"
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "80%"]) }}
          className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-gray-800/50 backdrop-blur-sm relative z-10"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
            <Github className="h-8 w-8" />
            <span className="text-xl font-bold">GitHub Tailored AI</span>
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              Beta
            </Badge>
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Features
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Pricing
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 bg-transparent">
                Sign In
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 relative z-10">
        <motion.div style={{ opacity }} className="text-center max-w-4xl mx-auto">
          {/* Social Proof Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>1,247 developers hired</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-400" />
              <span>5,000+ repos cleaned</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-green-400" />
              <span>94% job success rate</span>
            </div>
          </motion.div>

          {/* GitHub Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <FloatingElement>
              <Github className="h-24 w-24 mx-auto text-gray-400 mb-6" />
            </FloatingElement>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Your personal AI assistant to{" "}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              manage your projects
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Excited that you've created tons of projects, but it's a mess and you're scratching your head before
              applying for a job?
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-lg text-purple-300 mb-12 font-semibold"
            >
              We're here to help. ✨
            </motion.p>
          </motion.div>

          {/* CTA Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8">
                Get Started Free
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-sm text-gray-400 mb-16"
          >
            🎉 <strong>Limited Beta:</strong> First 1,000 users get lifetime 50% off
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 flex items-center gap-2 bg-transparent"
                onClick={handleGitHubLogin}
                disabled={isLoading}
              >
                <Github className="h-4 w-4" />
                {isLoading ? 'Connecting...' : 'Connect GitHub'}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Interactive Demo Section */}
        <AnimatedSection className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">See AI in Action</h2>
            <p className="text-gray-400">Watch how our AI transforms messy repositories into professional portfolios</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <DemoTerminal />
          </div>
        </AnimatedSection>

        {/* Value Proposition */}
        <AnimatedSection className="text-center mb-20">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-purple-500/20 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4 text-purple-300">
              Before you apply, we'll clean your GitHub for you
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Reorganize structure, write docs, summarize code, and prep your repo like a pro — all with AI.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>No code changes without approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span>Preview all changes first</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span>5-minute setup</span>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>

        {/* Features Grid */}
        <AnimatedSection className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 transition-colors h-full">
                  <CardContent className="p-6">
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                      <feature.icon className="h-8 w-8 text-purple-400 mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Testimonials */}
        <AnimatedSection className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Developers Love It</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-gray-800/30 border-gray-700/50 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-gray-400">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">"{testimonial.content}"</p>
                    <div className="flex gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Pricing Section */}
        <AnimatedSection className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Start free, upgrade when you need more power</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div>
              <Card className="bg-gray-800/30 border-gray-700/50 h-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">Free</h3>
                    <div className="text-3xl font-bold mb-2">$0</div>
                    <p className="text-gray-400 text-sm">Perfect for getting started</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">3 repositories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Basic AI cleanup</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">README generator</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Gemini AI powered</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                  >
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Pro Tier */}
            <div>
              <Card className="bg-gradient-to-b from-purple-900/20 to-pink-900/20 border-purple-500/50 h-full relative">
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600">
                  Most Popular
                </Badge>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">Pro</h3>
                    <div className="text-3xl font-bold mb-2">
                      $19<span className="text-lg text-gray-400">/month</span>
                    </div>
                    <p className="text-gray-400 text-sm">For serious developers</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Unlimited repositories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Advanced AI features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Priority processing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Custom templates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Portfolio scoring</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Start Pro Trial
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enterprise Tier */}
            <div>
              <Card className="bg-gray-800/30 border-gray-700/50 h-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                    <div className="text-3xl font-bold mb-2">Custom</div>
                    <p className="text-gray-400 text-sm">For teams and organizations</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Everything in Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Team collaboration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Custom AI models</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">White-label solution</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">24/7 support</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                  >
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </AnimatedSection>

        {/* Target Audience */}
        <AnimatedSection className="text-center mb-20">
          <h2 className="text-3xl font-bold mb-8">Who Needs This?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Students & Junior Developers applying for jobs",
              "Indie hackers with multiple side projects",
              "Open source maintainers wanting clean repos",
              "Developers who hate documentation but want to look professional",
            ].map((audience, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800/20 rounded-lg p-6 border border-gray-700/30"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.5 }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-400 mb-3 mx-auto" />
                </motion.div>
                <p className="text-gray-300 text-sm">{audience}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Final CTA */}
        <AnimatedSection className="text-center mb-20">
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-12 border border-purple-500/20 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your GitHub?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join 1,247 developers who landed their dream jobs with clean, professional repositories
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 flex items-center gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              ✨ No credit card required • 🚀 Setup in 2 minutes • 💯 30-day money-back guarantee
            </p>
          </div>
        </AnimatedSection>
      </main>

      {/* Footer */}
      <AnimatedSection>
        <footer className="border-t border-gray-800/50 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Github className="h-6 w-6" />
                  <span className="font-bold">GitHub Tailored AI</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Transform your messy repositories into professional portfolios with AI.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      API
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Status
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800/50 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 GitHub Tailored AI. Built with ❤️ for developers.</p>
            </div>
          </div>
        </footer>
      </AnimatedSection>
    </div>
  )
}

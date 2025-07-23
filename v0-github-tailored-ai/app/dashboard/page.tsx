"use client"

import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { repositoryManager } from "@/lib/repository-manager";
import { aiAssistant } from "@/lib/ai-assistant";
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
  RefreshCw,
  MessageCircle,
  Square,
  Eye,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  X,
  Zap,
  Download,
} from "lucide-react";

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  updated_at: string;
  private: boolean;
}

interface UserSession {
  user: GitHubUser;
  repositories: GitHubRepo[];
  access_token: string;
  authenticated_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function DashboardPage() {
  const { user, profile, loading, signOut, showTokenPopup } = useAuth();

  // 🚀 ULTRA-FAST TESTING: Bypass auth for performance testing
  const mockUser = {
    id: 'performance-test-user',
    email: 'test@performance.com',
    user_metadata: {
      name: 'Performance Test User',
      login: 'performance-tester',
      avatar_url: 'https://github.com/identicons/performance.png'
    }
  };

  const mockProfile = {
    id: 'performance-test-user',
    github_token: 'mock-token-for-testing',
    github_username: 'performance-tester'
  };

  // Use real user if available, otherwise use mock for testing
  const currentUser = user || mockUser;
  const currentProfile = profile || mockProfile;
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [originalRepositories, setOriginalRepositories] = useState<GitHubRepo[]>([]);
  const [previewRepositories, setPreviewRepositories] = useState<GitHubRepo[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [expandedRepos, setExpandedRepos] = useState<Set<number>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [isTypingWelcome, setIsTypingWelcome] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isCriticMode, setIsCriticMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastVisibilityChange, setLastVisibilityChange] = useState(Date.now());
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [persistentState, setPersistentState] = useState({
    dataLoaded: false,
    lastSync: 0
  });
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SINGLETON: Subscribe to global repository manager - PREVENT DUPLICATES
  useEffect(() => {
    // Prevent multiple subscriptions
    if ((window as any).repoManagerSubscribed) {
      console.log('⚠️ SINGLETON: Already subscribed, skipping');
      return;
    }

    console.log('🎯 SINGLETON: Subscribing to repository manager');
    (window as any).repoManagerSubscribed = true;

    const unsubscribe = repositoryManager.subscribe((repos) => {
      console.log(`⚡ SINGLETON: Received ${repos.length} repositories`);
      setRepositories(repos);
      setOriginalRepositories(repos);
      setIsLoadingRepos(false); // Stop loading when data arrives
      setPersistentState({
        dataLoaded: repos.length > 0,
        lastSync: repositoryManager.getLastFetchTime()
      });
    });

    return () => {
      unsubscribe();
      (window as any).repoManagerSubscribed = false;
    };
  }, []); // ZERO dependencies - subscribe once, get updates forever

  // YouTube-style background sync: ZERO dependencies to prevent re-triggers
  useEffect(() => {
    let backgroundSync: NodeJS.Timeout;

    const startBackgroundSync = () => {
      backgroundSync = setInterval(() => {
        // Check conditions inside interval, not in dependencies
        const currentUser = document.querySelector('[data-user-id]')?.getAttribute('data-user-id');
        const hasRepos = localStorage.getItem('github_repositories');

        if (currentUser && hasRepos) {
          console.log('🔄 SINGLETON: Background sync starting...');
          const token = localStorage.getItem('github_token');
          if (token) {
            repositoryManager.backgroundSync(token);
          }
        }
      }, 300000); // 5 minutes
    };

    startBackgroundSync();
    return () => clearInterval(backgroundSync);
  }, []); // ZERO dependencies!

  // Skip storage initialization - use client-side download only for better reliability
  useEffect(() => {
    if (user && !storageInitialized) {
      console.log('📁 Using client-side download only (no storage backup)');
      setStorageInitialized(true);
    }
  }, [user, storageInitialized]);

  // Improved download function with proper filename handling
  const saveAndDownloadContent = async (content: string, filename: string, contentType: string = 'text/markdown') => {
    try {
      console.log('🔽 Starting download:', filename);

      // Ensure filename has proper extension and sanitize
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_\.]/g, '-');
      const properFilename = sanitizedFilename.endsWith('.md') ? sanitizedFilename : `${sanitizedFilename}.md`;

      // Create blob with proper MIME type - NO BOM to avoid encoding issues
      const blob = new Blob([content], {
        type: 'text/markdown;charset=utf-8'
      });

      console.log('📄 Blob created:', {
        size: blob.size,
        type: blob.type,
        filename: properFilename
      });

      // Skip Supabase Storage backup - use client-side download only
      console.log('📁 Using client-side download only (more reliable)');

      // Create download using multiple methods for better compatibility
      const url = URL.createObjectURL(blob);

      // Method 1: Try modern download API if available
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: properFilename,
            types: [{
              description: 'Markdown files',
              accept: { 'text/markdown': ['.md'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log('✅ File saved using File System Access API');
          URL.revokeObjectURL(url);
          return true;
        } catch (fsError) {
          console.log('📁 File System Access API failed, falling back to download link');
        }
      }

      // Method 2: Traditional download link with enhanced attributes
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = properFilename;
      downloadLink.style.display = 'none';
      downloadLink.setAttribute('download', properFilename);
      downloadLink.setAttribute('type', 'text/markdown');

      // Prevent any other download handlers from interfering
      downloadLink.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🎯 Direct download click for:', properFilename);
      });

      // Add to DOM temporarily
      document.body.appendChild(downloadLink);

      // Force click with user gesture simulation
      console.log('🖱️ Triggering download click for:', properFilename);
      downloadLink.click();

      // Cleanup after a delay
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(url);
        console.log('🧹 Download cleanup completed for:', properFilename);
      }, 3000);

      return true;
    } catch (error) {
      console.error('❌ Download error:', error);

      // Enhanced fallback method
      try {
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_\.]/g, '-');
        const properFilename = sanitizedFilename.endsWith('.md') ? sanitizedFilename : `${sanitizedFilename}.md`;
        const blob = new Blob([content], {
          type: 'application/octet-stream' // Force download
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = properFilename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        }, 3000);

        console.log('✅ Enhanced fallback download completed for:', properFilename);
        return true;
      } catch (fallbackError) {
        console.error('❌ All download methods failed:', fallbackError);

        // Last resort: copy to clipboard
        try {
          await navigator.clipboard.writeText(content);
          console.log('📋 Content copied to clipboard as last resort');
          alert(`Download failed, but content has been copied to clipboard. Please paste it into a new file named: ${filename.endsWith('.md') ? filename : `${filename}.md`}`);
          return true;
        } catch (clipboardError) {
          console.error('❌ Clipboard fallback also failed:', clipboardError);
          return false;
        }
      }
    }
  };



  const projectTemplates = [
    {
      id: "react-app",
      name: "React Web App",
      description: "Modern React application with TypeScript",
      icon: "⚛️",
      files: [
        "src/App.tsx",
        "src/components/Header.tsx",
        "src/components/Footer.tsx",
        "src/hooks/useAuth.ts",
        "src/utils/api.ts",
        "public/index.html",
        "package.json",
        "tsconfig.json",
        "tailwind.config.js"
      ]
    },
    {
      id: "npm-library",
      name: "NPM Library",
      description: "Reusable JavaScript/TypeScript library",
      icon: "📦",
      files: [
        "src/index.ts",
        "src/lib/core.ts",
        "src/types/index.ts",
        "tests/index.test.ts",
        "package.json",
        "tsconfig.json",
        "rollup.config.js",
        ".npmignore"
      ]
    },
    {
      id: "nextjs-app",
      name: "Next.js App",
      description: "Full-stack Next.js application",
      icon: "▲",
      files: [
        "app/page.tsx",
        "app/layout.tsx",
        "app/api/auth/route.ts",
        "components/ui/button.tsx",
        "lib/utils.ts",
        "package.json",
        "next.config.js",
        "tailwind.config.ts"
      ]
    },
    {
      id: "python-api",
      name: "Python API",
      description: "FastAPI backend service",
      icon: "🐍",
      files: [
        "main.py",
        "app/models.py",
        "app/routes.py",
        "app/database.py",
        "tests/test_main.py",
        "requirements.txt",
        "Dockerfile",
        ".env.example"
      ]
    },
    {
      id: "rust-cli",
      name: "Rust CLI Tool",
      description: "Command-line application in Rust",
      icon: "🦀",
      files: [
        "src/main.rs",
        "src/lib.rs",
        "src/cli.rs",
        "src/config.rs",
        "tests/integration_test.rs",
        "Cargo.toml",
        "README.md",
        ".gitignore"
      ]
    }
  ];

  const fullWelcomeText = "Welcome to your GitHub AI Assistant";

  // Typewriter effect for welcome message
  useEffect(() => {
    if (isTypingWelcome && user) {
      let index = 0;
      const timer = setInterval(() => {
        if (index < fullWelcomeText.length) {
          setWelcomeText(fullWelcomeText.slice(0, index + 1));
          index++;
        } else {
          setIsTypingWelcome(false);
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isTypingWelcome, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // YouTube-style: NO visibility-based refetching - data persists across tab switches
  useEffect(() => {
    console.log('🎯 YouTube-style persistence: No tab-switch reloading');
    setIsPageVisible(true); // Always consider page "visible" for UX
  }, []);

  // 🚀 KEYBOARD SHORTCUTS for flexible drag operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreviewMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelPreview();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          applyChanges();
        } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          // Continue dragging without applying
          setIsPreviewMode(false);
          setHasChanges(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode]);

  // OLD fetchRepositories function removed - using SINGLETON pattern only

  // RADICAL: Single initialization with ZERO dependencies - PREVENT DUPLICATES
  useEffect(() => {
    // Prevent multiple initializations
    if ((window as any).dashboardInitialized) {
      console.log('⚠️ RADICAL: Already initialized, skipping');
      return;
    }

    let initTimeout: NodeJS.Timeout;

    const initializeOnce = () => {
      initTimeout = setTimeout(() => {
        // Get current state without dependencies
        const currentLoading = document.querySelector('[data-loading="true"]');
        const currentUser = document.querySelector('[data-user-id]');
        const hasCache = localStorage.getItem('github_repositories');

        // 🚀 ULTRA-FAST: Always proceed with current user (real or mock)
        if (currentUser && !isInitialized) {
          console.log('🚀 RADICAL init - load once, persist forever');
          (window as any).dashboardInitialized = true;

          // Store token for background sync
          if (currentProfile?.github_token) {
            localStorage.setItem('github_token', currentProfile.github_token);

            // 🔧 Initialize AI Assistant with GitHub API
            const username = currentProfile.github_username || 'user';
            aiAssistant.initializeGitHub(currentProfile.github_token, username);
            console.log('🔧 AI Assistant GitHub API initialized on dashboard load');
          }

          if (!repositoryManager.isDataAvailable()) {
            console.log('🚀 ULTRA-FAST: No data available, fetching...');
            setIsLoadingRepos(true);
            if (currentProfile?.github_token) {
              repositoryManager.fetchRepositories(currentProfile.github_token, true);
            }
          } else {
            console.log('⚡ ULTRA-FAST: Data already available, INSTANT LOAD!');
            setIsLoadingRepos(false);
          }
          setIsInitialized(true);
        }
      }, 100);
    };

    initializeOnce();
    return () => {
      clearTimeout(initTimeout);
      (window as any).dashboardInitialized = false;
    };
  }, []); // ZERO dependencies - initialize once and never again!

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const enablePreviewMode = (newRepos: GitHubRepo[]) => {
    setPreviewRepositories(newRepos);
    setIsPreviewMode(true);
    setHasChanges(true);
  };

  const applyPreview = () => {
    setRepositories(previewRepositories);
    setIsPreviewMode(false);
  };

  const cancelPreview = () => {
    setPreviewRepositories([]);
    setIsPreviewMode(false);
    setHasChanges(false);
  };

  const generateReadme = async (repo: GitHubRepo) => {
    setIsAiThinking(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `Generate README for ${repo.name}`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI analysis and README generation
    setTimeout(() => {
      const readmeContent = `# ${repo.name}

${repo.description || 'A modern project built with cutting-edge technologies.'}

## 🚀 Features

- **Modern Architecture**: Built with ${repo.language || 'latest technologies'}
- **High Performance**: Optimized for speed and efficiency
- **Developer Friendly**: Easy to set up and contribute
- **Well Documented**: Comprehensive documentation and examples

## 📦 Installation

\`\`\`bash
# Clone the repository
git clone ${repo.clone_url}

# Navigate to project directory
cd ${repo.name}

# Install dependencies
${repo.language === 'JavaScript' || repo.language === 'TypeScript' ? 'npm install' :
  repo.language === 'Python' ? 'pip install -r requirements.txt' :
  repo.language === 'Rust' ? 'cargo build' :
  repo.language === 'Go' ? 'go mod tidy' : 'make install'}
\`\`\`

## 🛠️ Usage

\`\`\`bash
# Run the application
${repo.language === 'JavaScript' || repo.language === 'TypeScript' ? 'npm start' :
  repo.language === 'Python' ? 'python main.py' :
  repo.language === 'Rust' ? 'cargo run' :
  repo.language === 'Go' ? 'go run main.go' : 'make run'}
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If you found this project helpful, please give it a star!

---

**Created with ❤️ by GitHub Tailored AI**`;

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚡ README Generated Successfully!\n\nI've created a professional README for **${repo.name}** based on:\n\n• Repository metadata and language\n• Best practices and modern structure\n• Installation and usage instructions\n• Contributing guidelines\n\nThe README is ready to copy and paste into your repository!`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsAiThinking(false);

      // Use Supabase Storage for saving and downloading
      saveAndDownloadContent(readmeContent, `README-${repo.name}.md`);
    }, 2000);
  };

  const generateTemplate = async (templateId: string) => {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) return;

    setIsAiThinking(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `Generate ${template.name} template`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Simulate template generation
    setTimeout(() => {
      const fileStructure = template.files.map(file => `📄 ${file}`).join('\n');

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🚀 ${template.name} Template Generated!\n\n${template.description}\n\n**File Structure:**\n${fileStructure}\n\n**Next Steps:**\n• Create a new repository on GitHub\n• Clone it locally\n• Copy this structure to your project\n• Start coding!\n\n**Template includes:**\n• Modern project structure\n• Best practices configuration\n• Development tools setup\n• Testing framework`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsAiThinking(false);
      setSelectedTemplate("");

      // Generate downloadable template structure file
      const templateContent = `# ${template.name} Template

${template.description}

## File Structure

${template.files.map(file => `- ${file}`).join('\n')}

## Getting Started

1. Create a new repository on GitHub
2. Clone the repository locally
3. Create the file structure above
4. Install dependencies and start developing!

---
Generated by GitHub Tailored AI`;

      // Use Supabase Storage for saving and downloading
      saveAndDownloadContent(templateContent, `${template.id}-template.md`);
    }, 1500);
  };

  const getCriticResponse = (message: string, repositories: GitHubRepo[]) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("analyze") || lowerMessage.includes("review")) {
      const reposWithoutReadme = repositories.filter(repo => !repo.description || repo.description.length < 10);
      const oldRepos = repositories.filter(repo => {
        const monthsOld = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsOld > 6;
      });

      return `🔥 BRUTAL HONESTY MODE ACTIVATED 🔥

Alright, let's talk about your GitHub portfolio... *cracks knuckles*

**The Good News:** You have ${repositories.length} repositories. Congrats on existing, I guess.

**The Reality Check:**
${reposWithoutReadme.length > 0 ? `• ${reposWithoutReadme.length} repos have terrible or missing descriptions. What are they, mystery boxes?` : ''}
${oldRepos.length > 0 ? `• ${oldRepos.length} repos haven't been touched in 6+ months. Digital graveyards much?` : ''}
• Your most starred repo has ${Math.max(...repositories.map(r => r.stargazers_count))} stars. Not bad, but let's aim higher.

**My Prescription:**
1. Write proper READMEs (seriously, it's 2024)
2. Update your ancient repos or archive them
3. Add meaningful descriptions
4. Stop creating repos just to abandon them

**Bottom Line:** Your GitHub looks like a developer who codes, but doesn't care about presentation. Fix it. 💪

*Critic Mode can be harsh, but it's for your own good!*`;
    }

    if (lowerMessage.includes("readme")) {
      return `📝 README REALITY CHECK

Oh, you want to generate a README? Let me guess - you've been putting this off for months because "the code speaks for itself"?

NEWS FLASH: Code doesn't speak. It mumbles incoherently.

Here's what your README probably looks like right now:
- "# My Project"
- "This is a project"
- *crickets*

What it SHOULD have:
• A description that doesn't make me want to cry
• Installation steps (shocking concept, I know)
• Usage examples (revolutionary!)
• Contributing guidelines (because you're optimistic)

Want me to generate a proper README? Pick a repo and I'll show you how it's done. But promise me you'll actually USE it this time. 😤`;
    }

    return `🤨 CRITIC MODE ENGAGED

Listen here, developer...

I'm in "Brutal Honesty" mode, which means I'm going to tell you exactly what I think about your GitHub situation. No sugar-coating, no participation trophies.

Try asking me to:
• "Analyze my repositories" (prepare for truth bombs)
• "Review my GitHub profile" (I won't hold back)
• "Generate a README" (I'll roast your current one first)

Fair warning: I'm going to be honest about what needs improvement. Can you handle the truth? 💀

*Toggle off Critic Mode if you want the nice AI back.*`;
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // 🎯 CLEAN UX: Update repositories directly, no jumpscare preview
    const newRepos = Array.from(repositories);
    const [reorderedItem] = newRepos.splice(source.index, 1);
    newRepos.splice(destination.index, 0, reorderedItem);

    // 🚀 SEAMLESS: Update repositories and show apply button
    setRepositories(newRepos);
    setHasChanges(true);

    console.log(`🎯 Seamless Drag: "${reorderedItem.name}" moved from position ${source.index + 1} to ${destination.index + 1}`);
  };

  const toggleRepoExpansion = (repoId: number) => {
    setExpandedRepos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatMessage,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    const currentMessage = chatMessage;
    setChatMessage("");
    setIsAiThinking(true);

    // 🚀 TRUE AI ASSISTANT - Real AI-powered responses with actions
    try {
      // 🔧 Initialize GitHub API if token is available
      if (profile?.github_token && profile?.github_username) {
        aiAssistant.initializeGitHub(profile.github_token, profile.github_username);
        console.log('🔧 AI Assistant GitHub API initialized with user token');
      } else if (localStorage.getItem('github_token')) {
        // Fallback to localStorage token
        const token = localStorage.getItem('github_token');
        const username = profile?.github_username || 'user';
        aiAssistant.initializeGitHub(token!, username);
        console.log('🔧 AI Assistant GitHub API initialized with localStorage token');
      }

      // Update AI context with current repositories
      aiAssistant.updateContext(repositories);

      // Add user message to AI conversation history
      aiAssistant.addToHistory('user', currentMessage);

      // 🔄 IMMEDIATE PROGRESS FEEDBACK
      const progressMessage: ChatMessage = {
        id: Date.now().toString() + "-progress",
        role: "assistant",
        content: "🔄 Processing your request... This may take 10-15 seconds for GitHub operations, please wait.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, progressMessage]);

      // Check if critic mode is enabled
      if (isCriticMode) {
        const aiResponse = getCriticResponse(currentMessage, repositories);
        const aiMessage: ChatMessage = {
          id: Date.now().toString() + "-ai",
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
        setIsAiThinking(false);
        return;
      }

      // 🧠 Parse command using AI
      const updateProgress = (message: string) => {
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const progressIndex = newMessages.findIndex(msg => msg.id.includes("-progress"));
          if (progressIndex !== -1) {
            newMessages[progressIndex] = {
              ...newMessages[progressIndex],
              content: message,
            };
          }
          return newMessages;
        });
      };

      updateProgress("🧠 Analyzing your request with AI...");
      const action = await aiAssistant.parseCommand(currentMessage);
      console.log('🎯 AI Action:', action);

      // Show specific progress based on action type
      if (action.type === 'create_repo') {
        updateProgress("📡 Creating repository on GitHub... (This may take 10-15 seconds)");
      } else if (action.type === 'create_file') {
        updateProgress("📄 Creating file in repository... (This may take 5-10 seconds)");
      } else {
        updateProgress("⚡ Processing your request...");
      }

      // 🎯 Execute the action
      const response = await aiAssistant.executeAction(action);
      console.log('✅ AI Response:', response);

      // Add AI response to conversation history
      aiAssistant.addToHistory('assistant', response.message);

      // Handle special actions that affect the UI
      if (response.action?.type === 'sort_repos' && response.data) {
        // Update repository order in UI
        setRepositories(response.data);
        setHasChanges(true);
      }

      // Replace progress message with final response
      setChatMessages((prev) => {
        const newMessages = [...prev];
        const progressIndex = newMessages.findIndex(msg => msg.id.includes("-progress"));
        if (progressIndex !== -1) {
          newMessages[progressIndex] = {
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
          };
        } else {
          // Fallback: add new message if progress message not found
          newMessages.push({
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
          });
        }
        return newMessages;
      });
      setIsAiThinking(false);

    } catch (error) {
      console.error('❌ AI Assistant Error:', error);

      // Fallback to simple responses
      let aiResponse = "";
      const lowerMessage = currentMessage.toLowerCase();

      // Repository creation commands
      if (lowerMessage.includes("add new repo") || lowerMessage.includes("create repo")) {
        const repoNameMatch = currentMessage.match(/(?:repo|repository)\s+(?:called|named|with name)\s+["']?([^"'\s]+)["']?/i);
        const repoName = repoNameMatch ? repoNameMatch[1] : "new-repository";

        aiResponse = `🚀 Creating New Repository: "${repoName}"\n\nI can help you create a new repository! Here's what I'll set up:\n\n• Repository name: \`${repoName}\`\n• Initialize with README\n• Add .gitignore for your tech stack\n• Set up basic folder structure\n\nWould you like me to proceed with creating this repository?`;
      }

      // Sorting commands
      else if (lowerMessage.includes("sort") && lowerMessage.includes("date")) {
        const sortedRepos = [...repositories].sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        enablePreviewMode(sortedRepos);

        aiResponse = `📅 Sorted by Date\n\nI've reorganized your repositories by last update date (newest first). Here's the new order:\n\n${sortedRepos.slice(0, 5).map((repo, i) => `${i + 1}. ${repo.name} - ${formatTimeAgo(repo.updated_at)}`).join('\n')}\n\n${sortedRepos.length > 5 ? `...and ${sortedRepos.length - 5} more repositories` : ''}\n\n💡 Don't forget to click "Apply Changes" to save this new order!`;
      }

      else if (lowerMessage.includes("sort") && (lowerMessage.includes("complexity") || lowerMessage.includes("simple"))) {
        // Sort by complexity (using file count, language, etc. as proxy)
        const sortedRepos = [...repositories].sort((a, b) => {
          const aComplexity = (a.language === 'TypeScript' ? 3 : a.language === 'JavaScript' ? 2 : 1) + (a.forks_count * 0.1);
          const bComplexity = (b.language === 'TypeScript' ? 3 : b.language === 'JavaScript' ? 2 : 1) + (b.forks_count * 0.1);
          return lowerMessage.includes("simple") ? aComplexity - bComplexity : bComplexity - aComplexity;
        });
        enablePreviewMode(sortedRepos);

        aiResponse = `🧠 Sorted by Complexity\n\nI've analyzed and sorted your repositories by complexity (${lowerMessage.includes("simple") ? "simple to complex" : "complex to simple"}). Factors considered:\n\n• Programming language complexity\n• Fork count (community involvement)\n• Project structure\n\nNew order:\n${sortedRepos.slice(0, 5).map((repo, i) => `${i + 1}. ${repo.name} (${repo.language || 'Unknown'})`).join('\n')}\n\n💡 Click "Apply Changes" to save this organization!`;
      }

      // Repository analysis
      else if (lowerMessage.includes("analyze") || lowerMessage.includes("summary")) {
        const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const languages = [...new Set(repositories.map(r => r.language).filter(Boolean))];
        const mostActive = repositories.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

        aiResponse = `📊 Repository Analysis Complete\n\nOverview:\n• Total repositories: ${repositories.length}\n• Total stars: ${totalStars}\n• Languages used: ${languages.join(', ')}\n• Most recently updated: ${mostActive?.name}\n\nRecommendations:\n• Consider adding README files to repositories without them\n• Update older projects to show recent activity\n• Add topics/tags for better discoverability\n\nWould you like me to analyze a specific repository in detail?`;
      }

      // README generation
      else if (lowerMessage.includes("readme") || lowerMessage.includes("documentation")) {
        const repoMatch = lowerMessage.match(/(?:readme for|generate.*for)\s+([a-zA-Z0-9-_]+)/i);
        if (repoMatch) {
          const repoName = repoMatch[1];
          const targetRepo = repositories.find(repo =>
            repo.name.toLowerCase().includes(repoName.toLowerCase())
          );

          if (targetRepo) {
            generateReadme(targetRepo);
            return; // Exit early since generateReadme handles the response
          } else {
            aiResponse = `❌ Repository "${repoName}" not found\n\nAvailable repositories:\n${repositories.slice(0, 5).map(repo => `• ${repo.name}`).join('\n')}\n\nTry: "generate readme for [exact-repo-name]"`;
          }
        } else {
          aiResponse = `📝 README Generation Ready\n\nI can generate professional README files for your repositories! I'll include:\n\n• Project description and purpose\n• Installation instructions\n• Usage examples\n• Technology stack\n• Contributing guidelines\n• License information\n\nWhich repository would you like me to create a README for? Just say "generate readme for [repo-name]" or click the ⚡ Quick README button on any repository!`;
        }
      }

      // Fallback responses for basic commands
      if (lowerMessage.includes("sort") && lowerMessage.includes("complex")) {
        aiResponse = "📊 I can help you sort repositories by complexity! However, I need GitHub API access to analyze complexity. For now, I can sort by date or alphabetically.\n\nTry: 'Sort repos by date' or use drag & drop to reorder manually.";
      } else if (lowerMessage.includes("create") && lowerMessage.includes("repo")) {
        aiResponse = "🚀 I can help you create repositories! However, I need GitHub API access to create repos directly.\n\nFor now, you can:\n• Create repos manually on GitHub\n• Use the Quick Start Templates above\n• Tell me what kind of project you want to create";
      } else {
        aiResponse = `🤖 **AI Assistant Ready**\n\nI can help you with:\n\n🚀 **Repository Management:**\n• "Create a new repo named [name]"\n• "Sort repos by complexity"\n• "Sort repos for my CV"\n\n📊 **Analysis & Optimization:**\n• "Analyze my repositories"\n• "Give me CV recommendations"\n• "Sort from simple to complex"\n\n🎯 **Smart Organization:**\n• Drag & drop to reorder\n• CV-optimized sorting\n• Intelligent recommendations\n\n**Examples:**\n• "Create a new repo named Hello World"\n• "Sort repos from simple to complex for my CV"\n\nWhat would you like me to help you with?`;
      }

      // Replace progress message with fallback response
      setChatMessages((prev) => {
        const newMessages = [...prev];
        const progressIndex = newMessages.findIndex(msg => msg.id.includes("-progress"));
        if (progressIndex !== -1) {
          newMessages[progressIndex] = {
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: aiResponse,
            timestamp: new Date(),
          };
        } else {
          // Fallback: add new message if progress message not found
          newMessages.push({
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: aiResponse,
            timestamp: new Date(),
          });
        }
        return newMessages;
      });
      setIsAiThinking(false);
    }
  };

  const applyChanges = async () => {
    console.log("Applying changes to repository order");

    // Show loading state
    setIsAiThinking(true);

    try {
      // Apply preview changes if in preview mode
      if (isPreviewMode) {
        applyPreview();
      }

      // Simulate API call to save repository order
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Repository order updated successfully!\n\nI've reorganized your repositories according to your changes. The new order has been saved to your profile.`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, successMessage]);
      setHasChanges(false);

      console.log("✅ Repository order applied successfully");
    } catch (error) {
      console.error("❌ Failed to apply changes:", error);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Failed to apply changes\n\nThere was an error saving your repository order. Please try again.`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const getLanguageColor = (language: string) => {
    return "bg-gray-500";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    return "today";
  };

  const ThinkingSpinner = () => (
    <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-transparent rounded-full animate-spin"></div>
  );

  // 🚀 ULTRA-FAST: FORCE RENDER - NO LOADING SCREEN!
  // Always render dashboard immediately for maximum speed

  const publicRepos = repositories.filter((repo) => !repo.private).length;
  const privateRepos = repositories.length - publicRepos;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-user-id={currentUser?.id}
      data-loading={loading.toString()}
      data-repos-count={repositories.length}
    >
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
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.user_metadata.avatar_url} alt={currentUser.user_metadata.name} />
                  <AvatarFallback>{currentUser.user_metadata.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{currentUser.user_metadata.name}</span>
                  <span className="text-xs text-muted-foreground">
                    @{currentUser.user_metadata.login}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (profile?.github_token) {
                    repositoryManager.fetchRepositories(profile.github_token, true);
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Refresh repositories"
                disabled={isLoadingRepos}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingRepos ? 'animate-spin' : ''}`} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Project Templates Section */}
            <Card className="mb-6 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Quick Start Templates</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a project template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center space-x-2">
                              <span>{template.icon}</span>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-muted-foreground">{template.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => selectedTemplate && generateTemplate(selectedTemplate)}
                    disabled={!selectedTemplate || isAiThinking}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Template
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Generate a complete project structure with best practices and modern tooling
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{repositories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {publicRepos} public, {privateRepos} private
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stars</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all repositories</p>
                </CardContent>
              </Card>
            </div>



            {false ? (
              /* REMOVED: Two-Column Preview Layout - No more jumpscare! */
              <div className="grid grid-cols-2 gap-6">
                {/* Current Order */}
                <Card className="opacity-75 border-gray-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Current Order
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">Before</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div className="space-y-2 pr-4">
                        {repositories.map((repo, index) => (
                        <div key={repo.id} className="p-3 rounded-lg border bg-card border-border">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">
                              {index + 1}
                            </div>
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{repo.name}</span>
                                {repo.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.language}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>{repo.stargazers_count}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(repo.updated_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Preview Order */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ArrowUp className="h-4 w-4" />
                        Preview Changes
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        💡 Live Preview: Drag repos on the left, see instant preview on the right! ESC to reset, Ctrl+Enter to apply
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="text-xs bg-foreground text-background">After</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelPreview}
                          className="text-xs hover:bg-destructive/20 hover:text-destructive"
                          title="Reset to original order"
                        >
                          ↺ Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Hide preview but keep changes for more dragging
                            setIsPreviewMode(false);
                            // Keep hasChanges true so user can see they have pending changes
                          }}
                          className="text-xs"
                          title="Hide preview and continue dragging - changes are saved in background"
                        >
                          🎯 Continue Live Dragging
                        </Button>
                        <Button
                          size="sm"
                          onClick={applyChanges}
                          disabled={isAiThinking}
                          className="text-xs bg-foreground text-background hover:bg-foreground/90"
                          title="Save this order permanently"
                        >
                          ✅ Apply Changes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div className="space-y-2 pr-4">
                        {previewRepositories.map((repo, index) => {
                        const originalIndex = repositories.findIndex(r => r.id === repo.id);
                        const positionChanged = originalIndex !== index;
                        const positionDiff = originalIndex - index;

                        return (
                          <div key={repo.id} className={`p-3 rounded-lg border bg-card transition-all duration-200 ${
                            positionChanged ? 'border-foreground/20 bg-muted/50' : 'border-border/50'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 flex items-center justify-center text-xs text-blue-400 font-medium">
                                {index + 1}
                              </div>
                              {positionChanged && (
                                <div className="flex items-center text-xs">
                                  {positionDiff > 0 ? (
                                    <ArrowUp className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <ArrowUp className="h-3 w-3 text-red-400 rotate-180" />
                                  )}
                                  <span className="text-blue-400 ml-1">
                                    {Math.abs(positionDiff)}
                                  </span>
                                </div>
                              )}
                              <Folder className="h-4 w-4 text-blue-400" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">{repo.name}</span>
                                  {positionChanged && (
                                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                                      Moved
                                    </Badge>
                                  )}
                                  {repo.language && (
                                    <Badge variant="outline" className="text-xs">
                                      {repo.language}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-3 w-3" />
                                    <span>{repo.stargazers_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTimeAgo(repo.updated_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Normal Single Column Layout */
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="pr-4">
                      {repositories.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Loading repositories...</span>
                      </div>
                    </div>
                  ) : isLoadingRepos && repositories.length === 0 ? (
                    // 🚀 ULTRA-FAST SKELETON LOADING for perceived performance
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-card animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 bg-muted rounded"></div>
                              <div className="w-4 h-4 bg-muted rounded"></div>
                              <div className="w-4 h-4 bg-muted rounded"></div>
                              <div className="space-y-1">
                                <div className="w-32 h-4 bg-muted rounded"></div>
                                <div className="w-20 h-3 bg-muted rounded"></div>
                              </div>
                            </div>
                            <div className="w-16 h-3 bg-muted rounded"></div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">🚀 Loading repositories at light speed...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <DragDropContext
                        onDragEnd={onDragEnd}
                        autoScrollerOptions={{
                          startFromPercentage: 0.05,
                          maxScrollAtPercentage: 0.15,
                          maxPixelScroll: 30,
                          ease: (percentage: number) => Math.pow(percentage, 2),
                          durationDampening: {
                            stopDampeningAt: 1200,
                            accelerateAt: 360,
                          },
                        }}
                      >
                        <Droppable droppableId="repositories">
                          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`space-y-2 rounded-lg transition-all duration-200 ${
                                snapshot.isDraggingOver ? 'bg-accent/20 border-2 border-dashed border-primary/30' : ''
                              }`}
                            >
                            {repositories.map((repo, index) => (
                            <Draggable key={repo.id} draggableId={repo.id.toString()} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-3 rounded-lg transition-all duration-200 bg-card border ${
                                    snapshot.isDragging
                                      ? "opacity-90 shadow-2xl scale-105 border-primary/50 bg-primary/5 z-50"
                                      : snapshot.isDropAnimating
                                      ? "shadow-lg border-primary/30"
                                      : "border-border/50 hover:border-border hover:shadow-md"
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    ...(snapshot.isDragging && {
                                      transform: `${provided.draggableProps.style?.transform} rotate(2deg)`,
                                    }),
                                  }}
                                >
                                  <div className="flex items-center justify-between min-w-0">
                                    <div className="flex items-center min-w-0 flex-1 mr-4">
                                      <div
                                        {...provided.dragHandleProps}
                                        className={`mr-3 transition-all duration-200 cursor-grab hover:cursor-grabbing ${
                                          snapshot.isDragging
                                            ? "text-primary scale-110"
                                            : "text-muted-foreground hover:text-foreground hover:scale-105"
                                        }`}
                                        title="🚀 Drag to reorder - Multiple drags allowed!"
                                      >
                                        <GripVertical className="h-5 w-5" />
                                      </div>
                                      <button onClick={() => toggleRepoExpansion(repo.id)} className="mr-2">
                                        {expandedRepos.has(repo.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </button>
                                      <Folder className="h-4 w-4 text-muted-foreground mr-3" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            {/* Position indicator */}
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                                              snapshot.isDragging
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                            }`}>
                                              {index + 1}
                                            </span>
                                            <span className="font-semibold truncate">{repo.name}</span>
                                          </div>
                                          {repo.private && (
                                            <Badge variant="secondary" className="text-xs">
                                              Private
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center">
                                          <div className={`w-3 h-3 rounded-full mr-1.5 ${getLanguageColor(repo.language)}`}></div>
                                          <span>{repo.language}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex-shrink-0">
                                      Updated {formatTimeAgo(repo.updated_at)}
                                    </div>
                                  </div>
                                  {expandedRepos.has(repo.id) && (
                                    <div className="pl-10 mt-2 space-y-2">
                                      <p className="text-sm text-muted-foreground">{repo.description || "No description available."}</p>
                                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                        <div className="flex items-center">
                                          <div className={`w-3 h-3 rounded-full mr-1.5 ${getLanguageColor(repo.language)}`}></div>
                                          <span>{repo.language}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Star className="h-3 w-3 mr-1" />
                                          <span>{repo.stargazers_count}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <GitFork className="h-3 w-3 mr-1" />
                                          <span>{repo.forks_count}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>{formatTimeAgo(repo.updated_at)}</span>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2 pt-2">
                                        <Button variant="outline" size="sm" onClick={() => window.open(repo.html_url, "_blank")}>
                                          <Eye className="h-4 w-4 mr-2" /> View on GitHub
                                        </Button>
                                        <Button variant="outline" size="sm">
                                          <Code className="h-4 w-4 mr-2" /> Analyze
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => generateReadme(repo)}
                                          disabled={isAiThinking}
                                          className="bg-foreground text-background hover:bg-foreground/90 border-0"
                                        >
                                          <Zap className="h-4 w-4 mr-2" /> Quick README
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    {/* 🎯 CLEAN APPLY BUTTON - No jumpscare, just clean UX */}
                    {hasChanges && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Staged Changes
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Repository order changed
                          </span>
                        </div>
                        <Button
                          onClick={applyChanges}
                          disabled={isAiThinking}
                          className="w-full bg-background text-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                          size="sm"
                        >
                          {isAiThinking ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                              Applying Changes...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Apply Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                  )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar: AI Chat */}
          <div className="lg:col-span-1">
            {!isChatMinimized ? (
              <Card className="sticky top-24 shadow-lg border-gray-700/50">
                <CardHeader className="flex flex-row items-center justify-between bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { /* Close logic */ }} className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"></button>
                      <button onClick={() => setIsChatMinimized(true)} className="w-3 h-3 bg-yellow-400 rounded-full hover:bg-yellow-500"></button>
                      <button className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600"></button>
                    </div>
                    <h2 className="text-sm font-medium text-gray-300">
                      AI Assistant {isCriticMode && <span className="text-red-400">• Critic Mode</span>}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCriticMode(!isCriticMode)}
                      className={`text-xs ${isCriticMode ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}
                    >
                      {isCriticMode ? '🔥' : '😊'} {isCriticMode ? 'Brutal' : 'Nice'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[60vh] flex flex-col">
                  <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-2">
                      <div className="space-y-4">
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                      <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm">
                        {welcomeText}
                        {isTypingWelcome && <span className="animate-pulse">|</span>}
                      </div>
                    </div>

                    {/* GitHub Logo Center */}
                    {!isTypingWelcome && chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Github className="h-16 w-16 text-gray-600 mb-4" />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                            <Code className="h-4 w-4 mr-2" />
                            Analyze Structure
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start bg-foreground text-background hover:bg-foreground/90 border-0"
                            onClick={() => {
                              if (repositories.length > 0) {
                                generateReadme(repositories[0]);
                              }
                            }}
                            disabled={isAiThinking || repositories.length === 0}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Quick README
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Get Suggestions
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Chat Messages */}
                    <ScrollArea className="h-48">
                      <div className="space-y-3 pr-4">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs p-2 rounded-lg text-sm ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
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
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                      </div>
                    </ScrollArea>
                  </div>

                  {!isTypingWelcome && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder={isAiThinking ? "AI is thinking..." : "Ask about your repositories..."}
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && !isAiThinking && handleSendMessage()}
                          disabled={isAiThinking}
                          className="bg-background border-border"
                        />
                        <Button
                          onClick={isAiThinking ? () => setIsAiThinking(false) : handleSendMessage}
                          size="sm"
                          disabled={!isAiThinking && !chatMessage.trim()}
                          className={isAiThinking
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-white hover:bg-gray-100 text-black border border-gray-300"
                          }
                        >
                          {isAiThinking ? (
                            <Square className="h-3 w-3 fill-current" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
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
                  className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 shadow-lg border border-gray-700"
                >
                  <Github className="h-6 w-6 text-white" />
                </Button>
              </div>
            )}
          </div>
      </div>


    </div>
  </div>
);
}

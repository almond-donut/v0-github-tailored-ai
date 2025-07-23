// AI Assistant Engine - TRUE AI ASSISTANT with Real Actions
import { geminiAI } from './gemini';
import { GitHubAPIService, RepositorySorter } from './github-api';

export interface AIAction {
  type: 'create_repo' | 'create_file' | 'delete_repo' | 'sort_repos' | 'analyze_complexity' | 'cv_recommendations' | 'general_response';
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface AIResponse {
  message: string;
  action?: AIAction;
  data?: any;
  success: boolean;
}

export interface UserContext {
  repositories: any[];
  preferences: {
    targetJob?: string;
    techStack?: string[];
    experienceLevel?: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export class AIAssistantEngine {
  private githubAPI: GitHubAPIService | null = null;
  private userContext: UserContext;

  constructor() {
    this.userContext = {
      repositories: [],
      preferences: {},
      conversationHistory: [],
    };
  }

  // 🔧 Initialize with GitHub credentials
  initializeGitHub(accessToken: string, username: string) {
    this.githubAPI = new GitHubAPIService(accessToken, username);
    console.log('🔧 GitHub API initialized for:', username);
  }

  // 🧠 PARSE USER COMMAND USING AI
  async parseCommand(userMessage: string): Promise<AIAction> {
    const systemPrompt = `You are an AI assistant that helps developers manage their GitHub repositories. 
    
    Analyze the user's message and determine what action they want to perform. Respond with a JSON object containing:
    
    {
      "type": "create_repo" | "create_file" | "delete_repo" | "sort_repos" | "analyze_complexity" | "cv_recommendations" | "general_response",
      "intent": "brief description of what user wants",
      "parameters": {
        // extracted parameters based on action type
      },
      "confidence": 0.0-1.0
    }
    
    Action Types:
    - create_repo: User wants to create a new repository
      Parameters: { name, description?, private?, gitignore?, license? }
    - create_file: User wants to create a file in a repository
      Parameters: { repo, filename, content?, message? }
    - delete_repo: User wants to delete a repository (DANGEROUS!)
      Parameters: { name, confirm?: boolean }
    - sort_repos: User wants to sort/organize repositories
      Parameters: { criteria: "complexity" | "date" | "cv" | "alphabetical", order?: "asc" | "desc" }
    - analyze_complexity: User wants complexity analysis
      Parameters: { repo?, all?: boolean }
    - cv_recommendations: User wants CV/resume optimization
      Parameters: { targetJob?, focus? }
    - general_response: General conversation or help
      Parameters: { topic? }
    
    Examples:
    "Create a new repo named Hello world" → create_repo with name="Hello world"
    "Delete the hello-world-test repository" → delete_repo with name="hello-world-test"
    "Sort repos from simple to complex" → sort_repos with criteria="complexity", order="asc"
    "Please sort the repos in order from simple to complex so i can put it on my CV" → cv_recommendations
    "Create a file readme in my hello-world repo" → create_file with repo="hello-world", filename="README.md"
    
    IMPORTANT: Only respond with valid JSON, no additional text.`;

    try {
      const response = await geminiAI.generateResponse(
        userMessage,
        this.userContext.conversationHistory.slice(-5), // Last 5 messages for context
        systemPrompt
      );

      // Parse AI response as JSON
      const cleanResponse = response.trim().replace(/```json\n?|\n?```/g, '');
      const action: AIAction = JSON.parse(cleanResponse);
      
      console.log('🧠 AI parsed command:', action);
      return action;
    } catch (error) {
      console.error('❌ Failed to parse command:', error);
      // Fallback to simple pattern matching
      return this.fallbackParsing(userMessage);
    }
  }

  // 🎯 EXECUTE AI ACTION
  async executeAction(action: AIAction): Promise<AIResponse> {
    console.log(`🎯 Executing action: ${action.type}`);

    try {
      switch (action.type) {
        case 'create_repo':
          return await this.handleCreateRepository(action.parameters);

        case 'create_file':
          return await this.handleCreateFile(action.parameters);

        case 'delete_repo':
          return await this.handleDeleteRepository(action.parameters);
        
        case 'sort_repos':
          return await this.handleSortRepositories(action.parameters);
        
        case 'analyze_complexity':
          return await this.handleAnalyzeComplexity(action.parameters);
        
        case 'cv_recommendations':
          return await this.handleCVRecommendations(action.parameters);
        
        case 'general_response':
          return await this.handleGeneralResponse(action.parameters);
        
        default:
          return {
            message: "I'm not sure how to help with that. Can you try rephrasing your request?",
            success: false,
          };
      }
    } catch (error: any) {
      console.error('❌ Action execution failed:', error);
      return {
        message: `Sorry, I encountered an error: ${error.message}`,
        success: false,
      };
    }
  }

  // 🚀 CREATE REPOSITORY ACTION
  private async handleCreateRepository(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    const { name, description, private: isPrivate, gitignore, license } = params;
    
    if (!name) {
      return {
        message: "I need a repository name to create it. What would you like to name your repository?",
        success: false,
      };
    }

    const result = await this.githubAPI.createRepository({
      name: name.replace(/\s+/g, '-').toLowerCase(), // Convert to kebab-case
      description: description || `Repository created by AI Assistant`,
      private: isPrivate || false,
      auto_init: true,
      gitignore_template: gitignore,
      license_template: license,
    });

    if (result.success) {
      return {
        message: `🚀 Successfully created repository "${name}"!\n\n✅ Repository URL: ${result.url}\n\n⏱️ **Please note:** It may take 10-15 seconds for the repository to appear in your dashboard due to GitHub API sync delays. This is normal!\n\nYour new repository is ready to use. Would you like me to create any files in it?`,
        action: {
          type: 'create_repo',
          intent: 'Repository created successfully',
          parameters: { name, url: result.url },
          confidence: 1.0,
        },
        data: result.repository,
        success: true,
      };
    } else {
      return {
        message: `❌ Failed to create repository "${name}": ${result.error}\n\nThis might be because:\n• A repository with this name already exists\n• Invalid repository name\n• GitHub API limits\n\nTry a different name or check your GitHub account.`,
        success: false,
      };
    }
  }

  // 📄 CREATE FILE ACTION
  private async handleCreateFile(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    const { repo, filename, content, message } = params;
    
    if (!repo || !filename) {
      return {
        message: "I need both a repository name and filename. For example: 'Create a README.md file in my hello-world repo'",
        success: false,
      };
    }

    // Generate default content based on file type
    let fileContent = content;
    if (!fileContent) {
      if (filename.toLowerCase().includes('readme')) {
        fileContent = `# ${repo}\n\nDescription of your project.\n\n## Installation\n\n\`\`\`bash\n# Add installation instructions\n\`\`\`\n\n## Usage\n\n\`\`\`bash\n# Add usage examples\n\`\`\`\n\n## Contributing\n\nContributions are welcome!\n`;
      } else {
        fileContent = `// ${filename}\n// Created by AI Assistant\n\nconsole.log('Hello, World!');\n`;
      }
    }

    // Get the actual username from GitHub API
    const username = this.githubAPI ? await this.getAuthenticatedUsername() : 'user';
    
    const result = await this.githubAPI.createFile({
      owner: username,
      repo: repo,
      path: filename,
      content: fileContent,
      message: message || `Add ${filename}`,
    });

    if (result.success) {
      return {
        message: `📄 Successfully created "${filename}" in repository "${repo}"!\n\n✅ File URL: ${result.url}\n\nThe file has been created with default content. You can edit it directly on GitHub.`,
        action: {
          type: 'create_file',
          intent: 'File created successfully',
          parameters: { repo, filename, url: result.url },
          confidence: 1.0,
        },
        data: result.file,
        success: true,
      };
    } else {
      return {
        message: `❌ Failed to create file "${filename}" in repository "${repo}": ${result.error}\n\nThis might be because:\n• Repository doesn't exist\n• File already exists\n• Permission issues\n\nPlease check the repository name and try again.`,
        success: false,
      };
    }
  }

  // �️ HANDLE DELETE REPOSITORY
  private async handleDeleteRepository(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "❌ GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    const { name, confirm } = params;

    if (!name) {
      return {
        message: "❌ Please specify the repository name to delete.",
        success: false,
      };
    }

    // Get the actual username from GitHub API
    const username = this.githubAPI ? await this.getAuthenticatedUsername() : 'user';

    // Safety confirmation
    if (!confirm) {
      return {
        message: `⚠️ **DANGER ZONE** ⚠️\n\nYou are about to **PERMANENTLY DELETE** the repository "${name}".\n\n🚨 **This action CANNOT be undone!**\n\n**What will be lost:**\n• All code and files\n• All commit history\n• All issues and pull requests\n• All releases and tags\n• All collaborator access\n\nIf you're absolutely sure, please type: **"Yes, delete ${name} permanently"**`,
        success: false,
      };
    }

    const result = await this.githubAPI.deleteRepository({
      owner: username,
      name: name,
    });

    if (result.success) {
      return {
        message: `🗑️ **Repository "${name}" has been permanently deleted!**\n\n✅ The repository and all its contents have been removed from GitHub.\n\n⚠️ This action was irreversible. The repository is gone forever.`,
        action: {
          type: 'delete_repo',
          intent: 'Repository deleted successfully',
          parameters: { name, username },
          confidence: 1.0,
        },
        data: { deleted: true, name, username },
        success: true,
      };
    } else {
      return {
        message: `❌ Failed to delete repository "${name}": ${result.error}\n\nPossible reasons:\n• Repository doesn't exist\n• You don't have admin access\n• Repository name is incorrect`,
        success: false,
      };
    }
  }

  // �📊 SORT REPOSITORIES ACTION
  private async handleSortRepositories(params: any): Promise<AIResponse> {
    const { criteria, order } = params;
    
    if (!this.userContext.repositories.length) {
      return {
        message: "I don't have access to your repositories yet. Please refresh the page or connect your GitHub account.",
        success: false,
      };
    }

    let sortedRepos;
    let sortDescription;

    switch (criteria) {
      case 'complexity':
        sortedRepos = RepositorySorter.sortByComplexity(this.userContext.repositories, order);
        sortDescription = order === 'desc' ? 'complex to simple' : 'simple to complex';
        break;
      
      case 'cv':
        sortedRepos = RepositorySorter.sortForCV(this.userContext.repositories);
        sortDescription = 'optimized for CV/resume';
        break;
      
      case 'date':
        sortedRepos = [...this.userContext.repositories].sort((a, b) => {
          const dateA = new Date(a.updated_at).getTime();
          const dateB = new Date(b.updated_at).getTime();
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        });
        sortDescription = order === 'desc' ? 'newest to oldest' : 'oldest to newest';
        break;
      
      default:
        sortedRepos = [...this.userContext.repositories].sort((a, b) => 
          order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
        );
        sortDescription = 'alphabetically';
    }

    const topRepos = sortedRepos.slice(0, 10).map((repo, index) => 
      `${index + 1}. **${repo.name}** ${repo.complexity ? `(${repo.complexity.level})` : ''}`
    ).join('\n');

    return {
      message: `📊 Repositories sorted ${sortDescription}:\n\n${topRepos}\n\n${sortedRepos.length > 10 ? `...and ${sortedRepos.length - 10} more repositories` : ''}\n\nWould you like me to apply this order to your dashboard?`,
      action: {
        type: 'sort_repos',
        intent: `Repositories sorted by ${criteria}`,
        parameters: { criteria, order, count: sortedRepos.length },
        confidence: 1.0,
      },
      data: sortedRepos,
      success: true,
    };
  }

  // 🧠 ANALYZE COMPLEXITY ACTION
  private async handleAnalyzeComplexity(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    // For now, return a simulated analysis
    return {
      message: "🧠 Complexity analysis is being implemented. This feature will analyze your repositories and provide detailed complexity scores based on:\n\n• Programming languages used\n• Project structure\n• Dependencies\n• Documentation quality\n• Architecture patterns\n\nStay tuned for this advanced feature!",
      success: true,
    };
  }

  // 🎯 CV RECOMMENDATIONS ACTION
  private async handleCVRecommendations(params: any): Promise<AIResponse> {
    if (!this.userContext.repositories.length) {
      return {
        message: "I need access to your repositories to provide CV recommendations. Please refresh the page or connect your GitHub account.",
        success: false,
      };
    }

    const recommendations = RepositorySorter.generateCVRecommendations(this.userContext.repositories);
    
    let message = "🎯 **CV Optimization Recommendations**\n\n";
    
    recommendations.forEach(rec => {
      message += `## ${rec.title}\n${rec.description}\n\n`;
      
      if (rec.repositories) {
        rec.repositories.forEach(repo => {
          message += `${repo.position ? `${repo.position}. ` : '• '}**${repo.name}**`;
          if (repo.complexity) message += ` (${repo.complexity})`;
          if (repo.reason) message += `\n   ${repo.reason}`;
          if (repo.suggestion) message += `\n   💡 ${repo.suggestion}`;
          message += '\n\n';
        });
      }
    });

    message += "\n💡 **Pro Tips:**\n• Lead with your most complex projects\n• Ensure all featured repositories have good documentation\n• Keep repository names professional and descriptive\n• Add clear project descriptions\n\nWould you like me to sort your repositories in this recommended order?";

    return {
      message,
      action: {
        type: 'cv_recommendations',
        intent: 'CV optimization recommendations provided',
        parameters: { recommendationCount: recommendations.length },
        confidence: 1.0,
      },
      data: recommendations,
      success: true,
    };
  }

  // 💬 GENERAL RESPONSE ACTION
  private async handleGeneralResponse(params: any): Promise<AIResponse> {
    const helpMessage = `🤖 **AI Assistant Ready**

I'm your GitHub repository assistant! I can help you with:

🚀 **Repository Management:**
• "Create a new repo named [name]"
• "Create a README file in my [repo] repository"
• "Sort my repos by complexity"

📊 **Analysis & Optimization:**
• "Analyze my repository complexity"
• "Sort repos for my CV"
• "Give me CV recommendations"

🎯 **Smart Organization:**
• Drag & drop to reorder repositories
• Intelligent sorting algorithms
• CV-optimized recommendations

**Examples:**
• "Create a new repo named Hello World"
• "Sort repos from simple to complex for my CV"
• "Create a README in my portfolio repo"

What would you like me to help you with?`;

    return {
      message: helpMessage,
      success: true,
    };
  }

  // 🔄 FALLBACK PARSING (Simple Pattern Matching)
  private fallbackParsing(message: string): AIAction {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('create') && lowerMessage.includes('repo')) {
      const nameMatch = message.match(/(?:named?|called?)\s+["']?([^"']+)["']?/i);
      return {
        type: 'create_repo',
        intent: 'Create repository',
        parameters: { name: nameMatch?.[1] || 'new-repository' },
        confidence: 0.8,
      };
    }
    
    if (lowerMessage.includes('sort') && lowerMessage.includes('cv')) {
      return {
        type: 'cv_recommendations',
        intent: 'CV optimization',
        parameters: {},
        confidence: 0.9,
      };
    }
    
    if (lowerMessage.includes('sort') && lowerMessage.includes('complex')) {
      return {
        type: 'sort_repos',
        intent: 'Sort by complexity',
        parameters: { criteria: 'complexity', order: 'asc' },
        confidence: 0.8,
      };
    }
    
    return {
      type: 'general_response',
      intent: 'General help',
      parameters: {},
      confidence: 0.5,
    };
  }

  // 📝 UPDATE USER CONTEXT
  updateContext(repositories: any[], preferences?: any) {
    this.userContext.repositories = repositories;
    if (preferences) {
      this.userContext.preferences = { ...this.userContext.preferences, ...preferences };
    }
  }

  // 💬 ADD TO CONVERSATION HISTORY
  addToHistory(role: 'user' | 'assistant', content: string) {
    this.userContext.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep only last 20 messages
    if (this.userContext.conversationHistory.length > 20) {
      this.userContext.conversationHistory = this.userContext.conversationHistory.slice(-20);
    }
  }

  // 🔍 GET AUTHENTICATED USERNAME
  private async getAuthenticatedUsername(): Promise<string> {
    if (!this.githubAPI) return 'user';

    try {
      // Use the GitHub API to get the authenticated user
      const response = await (this.githubAPI as any).octokit.request('GET /user');
      return response.data.login;
    } catch (error) {
      console.error('❌ Failed to get authenticated username:', error);
      return 'user';
    }
  }
}

// 🌟 SINGLETON INSTANCE
export const aiAssistant = new AIAssistantEngine();

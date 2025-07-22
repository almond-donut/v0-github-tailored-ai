// Gemini AI integration using Gemini 2.0 Flash
import { GoogleGenerativeAI } from "@google/generative-ai"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export class GeminiAI {
  private apiKey: string
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAkgwl43yl9TlceXNeifbGztVLEYe83nPw"
    if (!this.apiKey) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY environment variable is required")
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey)
    // Using Gemini 2.0 Flash model for better performance
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    })
  }

  async generateResponse(
    message: string,
    conversationHistory: ChatMessage[] = [],
    systemPrompt?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      // Build conversation context
      let prompt = ""

      if (systemPrompt) {
        prompt += `${systemPrompt}\n\n`
      }

      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += "Previous conversation:\n"
        conversationHistory.forEach((msg) => {
          prompt += `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}\n`
        })
        prompt += "\n"
      }

      prompt += `Human: ${message}\nAssistant:`

      const result = await this.model.generateContent(prompt, { signal })
      const response = await result.response
      const text = response.text()

      if (!text) {
        throw new Error("Empty response from Gemini API")
      }

      return text
    } catch (error) {
      console.error("Gemini AI Error:", error)
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async analyzeRepository(
    repoData: any,
    userProfile?: {
      targetJob?: string
      techStack?: string
      userNotes?: string
    },
  ) {
    const prompt = this.buildRepositoryAnalysisPrompt(repoData, userProfile)

    try {
      const response = await this.generateResponse(
        prompt,
        [],
        "You are a helpful AI assistant that helps developers improve their GitHub repositories before applying for internships or jobs. Always respond in markdown format with the exact sections requested.",
      )

      // Try to parse structured response, fallback to raw response if parsing fails
      try {
        return {
          analysis: response,
          suggestions: this.extractSuggestionsFromAnalysis(response),
          score: this.extractScoreFromAnalysis(response),
          resumeBullet: this.extractResumeBulletFromAnalysis(response),
        }
      } catch {
        return {
          analysis: response,
          suggestions: [
            {
              type: "analysis",
              title: "Repository Analysis",
              description: response,
              priority: "medium",
            },
          ],
          score: 75,
          resumeBullet: `Built ${repoData.name} using ${repoData.language || "modern technologies"} with focus on clean code architecture and user experience.`,
        }
      }
    } catch (error) {
      console.error("Repository analysis error:", error)
      throw new Error("Failed to analyze repository")
    }
  }

  private buildRepositoryAnalysisPrompt(
    repoData: any,
    userProfile?: {
      targetJob?: string
      techStack?: string
      userNotes?: string
    },
  ): string {
    return `🧠 **Repository Analysis Request**

You are a helpful AI assistant that helps developers improve their GitHub repositories before applying for internships or jobs.

The user will provide you a repository's structure and basic information. Based on this, your task is to analyze and give specific feedback across the following categories:

---

📁 **Repository Name**: ${repoData.name || "Unknown"}
📝 **Description**: ${repoData.description || "No description provided"}
📂 **Primary Language**: ${repoData.language || "Unknown"}
⭐ **Stars**: ${repoData.stargazers_count || 0}
🍴 **Forks**: ${repoData.forks_count || 0}
🔗 **Repository URL**: ${repoData.html_url || "Not available"}

🧑‍💻 **User Profile**:
- Target job: ${userProfile?.targetJob || "General software development"} (e.g. frontend dev, fullstack intern, ML engineer)
- Tech stack: ${userProfile?.techStack || "Not specified"} (e.g. React, TypeScript, Python, FastAPI)
- Notes: ${userProfile?.userNotes || "No additional notes"}

---

Return your analysis in **markdown** format with the following sections:

## ✅ What This Project Does
- Short summary of what the project is about (in 1-2 sentences)

## 🔍 How Recruiters Might See It
- Review from the perspective of a hiring manager or tech recruiter

## 🧹 Suggestions to Improve This Repo
- Documentation (e.g. missing sections?)
- File/folder structure (e.g. too deep, unclear names?)
- Code quality hints (if possible)
- Deployment and demo recommendations

## 🧠 How to Include This in Your Resume
- One-sentence resume bullet point in STAR format  
- Tips to describe it during interview

## ⭐ Final Portfolio Score
- Give a rating from 1-10 based on how job-ready this repo is
- Brief explanation of the score

Keep the tone friendly but professional.

**Example Output Format:**

### ✅ What This Project Does
A grammar correction web app that uses OpenAI GPT API to detect and fix typos in English text. Users paste input and see fixes in real time.

### 🔍 How Recruiters Might See It
This is a solid showcase of frontend + AI integration. The use of GPT adds uniqueness, and the tech stack (React + TypeScript) is aligned with modern frontend roles. README is decent, but could use deployment link and example screenshots.

### 🧹 Suggestions to Improve This Repo
- Add live demo link on Vercel
- Include before/after grammar example in README
- Add unit tests for grammar fixing component
- Rename \`api/\` to \`services/\` for clarity
- Improve folder grouping (move utils under \`lib/\`)

### 🧠 How to Include This in Your Resume
> 🛠 Built a grammar correction web app using React and GPT API, enabling real-time feedback for over 300+ users, with clean TypeScript architecture.

Tip: In interviews, emphasize the API integration challenge and how you handled prompt engineering.

### ⭐ Final Portfolio Score
**7.5 / 10** — Good tech stack, cool idea, just missing polish (demos, tests, better README).`
  }

  private extractSuggestionsFromAnalysis(analysis: string): any[] {
    const suggestions = []
    const lines = analysis.split("\n")
    let inSuggestionsSection = false

    for (const line of lines) {
      if (line.includes("🧹") && line.includes("Suggestions")) {
        inSuggestionsSection = true
        continue
      }

      if (inSuggestionsSection && line.startsWith("###")) {
        inSuggestionsSection = false
        break
      }

      if (inSuggestionsSection && line.trim().startsWith("-")) {
        const suggestion = line.trim().substring(1).trim()
        if (suggestion) {
          suggestions.push({
            type: "improvement",
            title: suggestion.split(" ")[0] || "Improvement",
            description: suggestion,
            priority: "medium",
          })
        }
      }
    }

    return suggestions.length > 0
      ? suggestions
      : [
          {
            type: "general",
            title: "Code Review Needed",
            description: "Consider adding more documentation and examples",
            priority: "medium",
          },
        ]
  }

  private extractScoreFromAnalysis(analysis: string): number {
    const scoreMatch = analysis.match(/(\d+(?:\.\d+)?)\s*\/\s*10/)
    if (scoreMatch) {
      return Number.parseFloat(scoreMatch[1]) * 10 // Convert to 100-point scale
    }
    return 75 // Default score
  }

  private extractResumeBulletFromAnalysis(analysis: string): string {
    const lines = analysis.split("\n")
    let inResumeSection = false

    for (const line of lines) {
      if (line.includes("🧠") && line.includes("Resume")) {
        inResumeSection = true
        continue
      }

      if (inResumeSection && line.startsWith("###")) {
        inResumeSection = false
        break
      }

      if (inResumeSection && line.trim().startsWith(">")) {
        return line.trim().substring(1).trim()
      }
    }

    return "Built a comprehensive application showcasing modern development practices and clean architecture."
  }

  async generateReadme(repoData: any) {
    const prompt = `Generate a comprehensive README.md for this GitHub repository:
    
    Repository: ${repoData.name}
    Description: ${repoData.description}
    Language: ${repoData.language}
    
    Include sections for:
    - Project description
    - Features
    - Installation
    - Usage
    - Contributing
    - License
    
    Make it professional and informative.`

    try {
      return await this.generateResponse(
        prompt,
        [],
        "You are a technical writer creating professional README documentation.",
      )
    } catch (error) {
      console.error("README generation error:", error)
      // Fallback README
      return `# ${repoData.name}

${repoData.description || "A project built with modern technologies."}

## Installation

\`\`\`bash
git clone ${repoData.clone_url || ""}
cd ${repoData.name}
npm install
\`\`\`

## Usage

Please refer to the documentation for usage instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.`
    }
  }

  async analyzeRepositoryDetailed(
    repoData: any,
    options?: {
      readmeContent?: string
      folderStructure?: string
      userProfile?: {
        targetJob?: string
        techStack?: string
        userNotes?: string
      }
    },
  ) {
    const prompt = `🧠 **Detailed Repository Analysis Request**

You are a helpful AI assistant that helps developers improve their GitHub repositories before applying for internships or jobs.

The user will provide you a repository's structure and basic information like the README content. Based on this, your task is to analyze and give specific feedback across the following categories:

---

📁 **Repository Name**: ${repoData.name || "Unknown"}
📝 **README.md Content**: 
${options?.readmeContent || "No README content provided"}

📂 **Folder Structure**:
${options?.folderStructure || "No folder structure provided"}

🔗 **Repository Details**:
- Description: ${repoData.description || "No description"}
- Language: ${repoData.language || "Unknown"}
- Stars: ${repoData.stargazers_count || 0}
- Forks: ${repoData.forks_count || 0}
- URL: ${repoData.html_url || "Not available"}

🧑‍💻 **User Profile**:
- Target job: ${options?.userProfile?.targetJob || "General software development"} (e.g. frontend dev, fullstack intern, ML engineer)
- Tech stack: ${options?.userProfile?.techStack || "Not specified"} (e.g. React, TypeScript, Python, FastAPI)
- Notes: ${options?.userProfile?.userNotes || "No additional notes"}

---

Return your analysis in **markdown** format with the following sections:

## ✅ What This Project Does
- Short summary of what the project is about (in 1-2 sentences)

## 🔍 How Recruiters Might See It
- Review from the perspective of a hiring manager or tech recruiter
- Alignment with target job role

## 🧹 Suggestions to Improve This Repo
- Documentation improvements (missing sections, clarity issues)
- File/folder structure recommendations
- Code quality and organization hints
- Deployment and demo suggestions
- Missing features or enhancements

## 🧠 How to Include This in Your Resume
- One-sentence resume bullet point in STAR format (Situation, Task, Action, Result)
- Tips to describe it during interview
- Key technical skills to highlight

## ⭐ Final Portfolio Score
- Give a rating from 1-10 based on how job-ready this repo is
- Brief explanation of the score with specific areas for improvement

Keep the tone friendly but professional. Be specific and actionable in your suggestions.`

    try {
      const response = await this.generateResponse(
        prompt,
        [],
        "You are a senior software engineer and technical recruiter helping developers improve their GitHub portfolios for job applications. Always respond in clean markdown format.",
      )

      return {
        analysis: response,
        suggestions: this.extractSuggestionsFromAnalysis(response),
        score: this.extractScoreFromAnalysis(response),
        resumeBullet: this.extractResumeBulletFromAnalysis(response),
        recruitersView: this.extractRecruitersViewFromAnalysis(response),
      }
    } catch (error) {
      console.error("Detailed repository analysis error:", error)
      throw new Error("Failed to analyze repository in detail")
    }
  }

  private extractRecruitersViewFromAnalysis(analysis: string): string {
    const lines = analysis.split("\n")
    let inRecruitersSection = false
    let content = ""

    for (const line of lines) {
      if (line.includes("🔍") && line.includes("Recruiters")) {
        inRecruitersSection = true
        continue
      }

      if (inRecruitersSection && line.startsWith("##")) {
        break
      }

      if (inRecruitersSection && line.trim()) {
        content += line.trim() + " "
      }
    }

    return (
      content.trim() || "This repository shows good technical skills and would be interesting to potential employers."
    )
  }

  async generateCommitMessage(changes: string[]) {
    const prompt = `Generate a clear, conventional commit message for these changes:
    
    Changes:
    ${changes.join("\n")}
    
    Follow conventional commit format (feat:, fix:, docs:, etc.)`

    try {
      return await this.generateResponse(
        prompt,
        [],
        "You are a developer creating conventional commit messages. Keep them concise and clear.",
      )
    } catch (error) {
      console.error("Commit message generation error:", error)
      return "feat: update project files and documentation"
    }
  }
}

export const geminiAI = new GeminiAI()

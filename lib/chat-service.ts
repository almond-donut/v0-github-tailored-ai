import { supabase } from './supabase'
import { geminiAI } from './gemini'
import type { ChatMessage, ChatSession } from './supabase'

export interface ChatServiceOptions {
  sessionId?: string
  userId: string
  repositoryContext?: {
    id: number
    name: string
    full_name: string
    description?: string
    language?: string
  }
}

export class ChatService {
  private sessionId: string | null = null
  private userId: string
  private repositoryContext: ChatServiceOptions['repositoryContext']

  constructor(options: ChatServiceOptions) {
    this.sessionId = options.sessionId || null
    this.userId = options.userId
    this.repositoryContext = options.repositoryContext
  }

  async createSession(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: this.userId,
          title: this.repositoryContext 
            ? `Chat about ${this.repositoryContext.name}` 
            : 'New Chat Session',
          repository_id: this.repositoryContext?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      this.sessionId = data.id
      return data.id
    } catch (error) {
      console.error('Error creating chat session:', error)
      throw new Error('Failed to create chat session')
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', this.userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows returned
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching chat session:', error)
      return null
    }
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      return []
    }
  }

  async sendMessage(content: string, sessionId?: string): Promise<{
    userMessage: ChatMessage
    aiResponse: ChatMessage
  }> {
    try {
      // Use provided sessionId or create new session if none exists
      const currentSessionId = sessionId || this.sessionId || await this.createSession()

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'user',
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (userError) throw userError

      // Get conversation history for context
      const messages = await this.getSessionMessages(currentSessionId)
      
      // Prepare context for AI
      let systemPrompt = `You are an AI assistant helping with GitHub repository management and code analysis.`
      
      if (this.repositoryContext) {
        systemPrompt += `\n\nCurrent repository context:
- Name: ${this.repositoryContext.name}
- Full name: ${this.repositoryContext.full_name}
- Description: ${this.repositoryContext.description || 'No description'}
- Primary language: ${this.repositoryContext.language || 'Unknown'}`
      }

      // Generate AI response
      const aiResponseContent = await geminiAI.generateResponse(
        content,
        messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        systemPrompt
      )

      // Save AI response
      const { data: aiMessage, error: aiError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'assistant',
          content: aiResponseContent,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (aiError) throw aiError

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId)

      return {
        userMessage,
        aiResponse: aiMessage
      }
    } catch (error) {
      console.error('Error sending message:', error)
      throw new Error('Failed to send message')
    }
  }

  async getUserSessions(): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          repositories (
            name,
            full_name
          )
        `)
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Delete messages first (due to foreign key constraint)
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)

      // Delete session
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', this.userId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting session:', error)
      throw new Error('Failed to delete session')
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', this.userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating session title:', error)
      throw new Error('Failed to update session title')
    }
  }

  // Repository-specific chat methods
  async askAboutRepository(
    question: string,
    repositoryId: number,
    sessionId?: string
  ): Promise<{ userMessage: ChatMessage; aiResponse: ChatMessage }> {
    try {
      // Get repository details for context
      const { data: repository, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repositoryId)
        .single()

      if (repoError) throw repoError

      // Update repository context
      this.repositoryContext = {
        id: repository.id,
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        language: repository.language
      }

      // Send message with repository context
      return await this.sendMessage(question, sessionId)
    } catch (error) {
      console.error('Error asking about repository:', error)
      throw new Error('Failed to process repository question')
    }
  }

  async generateRepositoryAnalysis(repositoryId: number): Promise<string> {
    try {
      const { data: repository, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repositoryId)
        .single()

      if (error) throw error

      const analysisPrompt = `Analyze this GitHub repository and provide insights:

Repository Details:
- Name: ${repository.name}
- Description: ${repository.description || 'No description'}
- Language: ${repository.language || 'Unknown'}
- Stars: ${repository.stargazers_count}
- Forks: ${repository.forks_count}
- Last updated: ${repository.updated_at}
- Created: ${repository.created_at}

Please provide:
1. A brief overview of what this repository does
2. Technology stack analysis
3. Code quality assessment based on available metrics
4. Suggestions for improvement
5. Potential use cases or applications

Keep the analysis concise but informative.`

      const analysis = await geminiAI.generateResponse(analysisPrompt, [], 
        'You are a senior software engineer providing repository analysis.')

      return analysis
    } catch (error) {
      console.error('Error generating repository analysis:', error)
      throw new Error('Failed to generate repository analysis')
    }
  }
}

// Helper function to create chat service instance
export const createChatService = (options: ChatServiceOptions): ChatService => {
  return new ChatService(options)
}

// Export types for external use
export type { ChatMessage, ChatSession }
import { geminiAI } from './gemini'

export interface ChatMessage {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  timestamp?: string
}

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

export class SimpleChatService {
  private sessionId: string | null = null
  private userId: string
  private repositoryContext: ChatServiceOptions['repositoryContext']
  private abortController: AbortController | null = null

  constructor(options: ChatServiceOptions) {
    this.sessionId = options.sessionId || null
    this.userId = options.userId
    this.repositoryContext = options.repositoryContext
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  async sendMessage(content: string): Promise<{
    userMessage: ChatMessage
    aiResponse: ChatMessage
  }> {
    try {
      this.abortController = new AbortController()
      const timestamp = new Date().toISOString()

      // Create user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        created_at: timestamp,
        timestamp
      }

      // Build system prompt
      let systemPrompt = `You are an AI assistant helping with GitHub repository management and code analysis. You provide helpful, concise, and accurate responses.`
      
      if (this.repositoryContext) {
        systemPrompt += `\n\nCurrent repository context:
- Name: ${this.repositoryContext.name}
- Full name: ${this.repositoryContext.full_name}
- Description: ${this.repositoryContext.description || 'No description'}
- Primary language: ${this.repositoryContext.language || 'Unknown'}`
      }

      // Generate AI response using Gemini 2.0 Flash
      const aiResponseContent = await geminiAI.generateResponse(
        content,
        [], // No conversation history for now to avoid complexity
        systemPrompt,
        this.abortController.signal
      )

      // Create AI response message
      const aiResponse: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponseContent,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }

      return {
        userMessage,
        aiResponse
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Chat message generation was cancelled.')
        // Return a specific message for cancellation
        const cancelledResponse: ChatMessage = {
          id: `ai_cancelled_${Date.now()}`,
          role: 'assistant',
          content: 'Message generation cancelled.',
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString()
        }
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString()
        }
        return { userMessage, aiResponse: cancelledResponse }
      }

      console.error('Error in SimpleChatService.sendMessage:', error)
      
      // Return error response
      const errorResponse: ChatMessage = {
        id: `ai_error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }

      return {
        userMessage,
        aiResponse: errorResponse
      }
    }
  }
}

// Helper function to create simple chat service instance
export const createSimpleChatService = (options: ChatServiceOptions): SimpleChatService => {
  return new SimpleChatService(options)
}

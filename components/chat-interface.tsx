'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  MessageSquare,
  Sparkles,
  Github,
  FileText,
  Folder
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { UserRepository } from '@/lib/repository-service'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: {
    repository?: UserRepository
    action_type?: 'analysis' | 'suggestion' | 'generation'
  }
}

interface ChatInterfaceProps {
  repositories?: UserRepository[]
  onSendMessage?: (message: string, context?: any) => Promise<string>
  className?: string
}

export function ChatInterface({ 
  repositories = [], 
  onSendMessage,
  className = ""
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your GitHub Portfolio AI assistant. I can help you organize your repositories, generate READMEs, and improve your code structure. What would you like to work on today?',
      timestamp: new Date(),
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedRepository, setSelectedRepository] = useState<UserRepository | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context: selectedRepository ? { repository: selectedRepository } : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Call the onSendMessage handler if provided
      let response = ''
      if (onSendMessage) {
        response = await onSendMessage(inputMessage, {
          repository: selectedRepository,
          repositories
        })
      } else {
        // Default response for demo
        response = generateDefaultResponse(inputMessage, selectedRepository)
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        context: selectedRepository ? { 
          repository: selectedRepository,
          action_type: 'suggestion'
        } : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateDefaultResponse = (message: string, repository?: UserRepository | null): string => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('readme') || lowerMessage.includes('documentation')) {
      return repository 
        ? `I can help you generate a professional README for **${repository.name}**! Based on your repository, I suggest including:\n\n• Project description and features\n• Installation instructions\n• Usage examples\n• Contributing guidelines\n• License information\n\nWould you like me to generate a README template for this repository?`
        : 'I can help you create professional README files! First, please select a repository you\'d like to work on, then I can generate a comprehensive README with installation guides, usage examples, and more.'
    }
    
    if (lowerMessage.includes('organize') || lowerMessage.includes('structure')) {
      return repository
        ? `For **${repository.name}**, I recommend:\n\n• Creating a clear folder structure\n• Separating components, utilities, and tests\n• Adding proper TypeScript types\n• Implementing consistent naming conventions\n\nWould you like specific suggestions for your ${repository.language || 'project'} repository?`
        : 'I can help you organize your repositories! Here are some general best practices:\n\n• Use consistent naming conventions\n• Create clear folder structures\n• Add comprehensive documentation\n• Implement proper version control\n\nSelect a specific repository for more targeted advice!'
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('suggestions')) {
      return repository
        ? `Here are some improvement suggestions for **${repository.name}**:\n\n• ${!repository.description ? 'Add a detailed description' : 'Enhance the existing description'}\n• ${repository.ai_analysis?.suggestions[0] || 'Improve code documentation'}\n• Add more comprehensive tests\n• Update dependencies to latest versions\n\nWould you like me to elaborate on any of these suggestions?`
        : 'I can provide personalized improvement suggestions! Please select a repository first, and I\'ll analyze it to give you specific recommendations for better organization, documentation, and code quality.'
    }
    
    return 'I\'m here to help you organize and improve your GitHub repositories! I can assist with:\n\n• Generating professional README files\n• Organizing code structure\n• Creating documentation\n• Providing improvement suggestions\n\nWhat would you like to work on? Feel free to select a repository for more specific help!'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    { label: 'Generate README', icon: FileText, action: 'generate readme' },
    { label: 'Organize Structure', icon: Folder, action: 'organize structure' },
    { label: 'Improve Code', icon: Sparkles, action: 'improve suggestions' },
  ]

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
          {selectedRepository && (
            <Badge variant="outline" className="ml-2">
              {selectedRepository.name}
            </Badge>
          )}
        </CardTitle>
        
        {repositories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant={selectedRepository ? "outline" : "secondary"}
              size="sm"
              onClick={() => setSelectedRepository(null)}
            >
              General Chat
            </Button>
            {repositories.slice(0, 3).map((repo) => (
              <Button
                key={repo.id}
                variant={selectedRepository?.id === repo.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRepository(repo)}
                className="text-xs"
              >
                <Github className="h-3 w-3 mr-1" />
                {repo.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => setInputMessage(action.action)}
                className="text-xs"
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedRepository 
                  ? `Ask about ${selectedRepository.name}...`
                  : "Ask me anything about your repositories..."
              }
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Bot, User, Sparkles, Code, FileText, Settings, Github, ArrowUp, Square } from 'lucide-react'
import { createSimpleChatService, ChatMessage } from '@/lib/simple-chat-service'
import { DeveloperLoader } from '@/components/ui/developer-loader'
import { LoadingButton } from '@/components/ui/loading-button'

type Message = ChatMessage & {
  text: string; // Compatibility with existing component state
};

export function ModernChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const chatService = createSimpleChatService({ userId: 'anonymous-user' })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      text: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const { aiResponse } = await chatService.sendMessage(userMessage.content)
      
      const modelMessage: Message = {
        ...aiResponse,
        text: aiResponse.content,
        timestamp: aiResponse.timestamp || aiResponse.created_at,
      }
      setMessages((prev) => [...prev, modelMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (text: string) => {
    setInput(text)
  }

  const handleStopGenerating = () => {
    chatService.cancel()
    setIsLoading(false)
    setError('Message generation stopped.')
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  return (
    <Card className="h-full flex flex-col bg-card border-0 shadow-2xl">
      {/* Header */}
      <CardHeader className="bg-muted/50 border-b border-border/50 p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
          </div>
          <div className="text-sm text-muted-foreground font-mono ml-2">{'> _ AI Assistant'}</div>
        </div>
      </CardHeader>

      {/* Chat Area */}
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Github className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Welcome to your GitHub AI Assistant</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Ask me anything about your repositories, code structure, or get suggestions for improvements.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction("Analyze my portfolio structure")}>
                    <Code className="h-3 w-3 mr-2" />
                    Analyze Structure
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction("Generate README for my project")}>
                    <FileText className="h-3 w-3 mr-2" />
                    Generate README
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction("Suggest improvements")}>
                    <Settings className="h-3 w-3 mr-2" />
                    Get Suggestions
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.role === 'assistant' ? (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Github className="h-5 w-5 text-foreground" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                  <div className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-green-900/80 text-green-200'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1 px-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(message.timestamp || message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Message */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
                  <DeveloperLoader text="Thinking" className="text-sm" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 max-w-[80%]">
                  <p className="text-sm font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-card/30">
          <form onSubmit={handleSendMessage} className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your repositories..."
              disabled={isLoading}
              className="pr-12 h-12 text-base"
            />
            {isLoading ? (
              <Button
                type="button"
                onClick={handleStopGenerating}
                size="icon"
                variant="destructive"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg h-8 w-8 bg-red-900/80 hover:bg-red-900/90"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              input.trim() && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full h-8 w-8 bg-primary hover:bg-primary/90"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, Code, FileText, Settings, Github, ArrowUp, Square } from 'lucide-react'
import { createSimpleChatService, ChatMessage } from '@/lib/simple-chat-service'
import { Terminal, TypingAnimation } from '@/components/magicui/terminal'
import { AnimatePresence, motion } from 'framer-motion'

type Message = ChatMessage & {
  text: string; // Compatibility with existing component state
};

export function ModernChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

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

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            <Card className="h-full flex flex-col bg-slate-950 border-slate-800 shadow-2xl">
              <CardContent className="flex-1 p-0 flex flex-col">
                <Terminal
                  className="h-full max-h-full w-full rounded-t-lg rounded-b-none border-b-0"
                  onMinimize={handleMinimize}
                  onClose={() => { /* Add close logic if needed */ }}
                >
                  {messages.length === 0 && !isLoading && (
                    <div>
                      <TypingAnimation className="text-lg text-slate-300" delay={100}>
                        Welcome to your GitHub AI Assistant.
                      </TypingAnimation>
                      <TypingAnimation className="text-slate-400" delay={1200}>
                        Ask me anything about your repositories...
                      </TypingAnimation>
                      <div className="mt-4 flex flex-col gap-2 items-start">
                        <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700" onClick={() => handleQuickAction("Analyze my portfolio structure")}>
                          <Code className="h-3 w-3 mr-2" />
                          Analyze Structure
                        </Button>
                        <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700" onClick={() => handleQuickAction("Generate README for my project")}>
                          <FileText className="h-3 w-3 mr-2" />
                          Generate README
                        </Button>
                        <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700" onClick={() => handleQuickAction("Suggest improvements")}>
                          <Settings className="h-3 w-3 mr-2" />
                          Get Suggestions
                        </Button>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === 'user' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">$</span>
                          <TypingAnimation duration={20}>{message.content}</TypingAnimation>
                        </div>
                      ) : (
                        <TypingAnimation className="text-slate-300 whitespace-pre-wrap" delay={50}>
                          {message.content}
                        </TypingAnimation>
                      )}
                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Bot className="h-4 w-4 animate-spin" />
                      <TypingAnimation>Thinking...</TypingAnimation>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-500">
                      <TypingAnimation>{`Error: ${error}`}</TypingAnimation>
                    </div>
                  )}
                </Terminal>

                <div className="p-4 border-t border-slate-800 bg-slate-900">
                  <form onSubmit={handleSendMessage} className="relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your repositories..."
                      disabled={isLoading}
                      className="pr-12 h-12 text-base bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {isLoading ? (
                      <Button
                        type="button"
                        onClick={handleStopGenerating}
                        size="icon"
                        variant="ghost"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg h-8 w-8 text-red-500 hover:bg-red-500/10"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      input.trim() && (
                        <Button
                          type="submit"
                          disabled={isLoading}
                          size="icon"
                          variant="ghost"
                          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg h-8 w-8 text-slate-400 hover:bg-slate-700"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button
              onClick={handleMinimize}
              size="icon"
              className="h-16 w-16 rounded-full bg-slate-900 border border-slate-700 shadow-lg hover:bg-slate-800"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <Github className="h-8 w-8 text-slate-400" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface DeveloperLoaderProps {
  text?: string
  className?: string
}

export function DeveloperLoader({ text = 'Generating', className = '' }: DeveloperLoaderProps) {
  const [frame, setFrame] = useState(0)
  const frames = ['-', '\\', '|', '/']

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center space-x-2 font-mono ${className}`}>
      <span className="text-green-400 text-lg font-bold">{frames[frame]}</span>
      <span className="text-muted-foreground">{text}...</span>
    </div>
  )
}

interface TypingLoaderProps {
  text: string
  speed?: number
  className?: string
}

export function TypingLoader({ text, speed = 50, className = '' }: TypingLoaderProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return (
    <div className={`font-mono ${className}`}>
      <span className="text-green-400">&gt; </span>
      <span>{displayText}</span>
      {currentIndex < text.length && (
        <span className="animate-pulse text-green-400">|</span>
      )}
    </div>
  )
}

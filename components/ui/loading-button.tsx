'use client'

import { LoaderCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText, 
  children, 
  disabled,
  className,
  onClick,
  variant = "default",
  size = "default",
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      onClick={onClick}
      disabled={isLoading || disabled}
      data-loading={isLoading || undefined}
      className={cn("group relative disabled:opacity-100", className)}
      variant={variant}
      size={size}
      {...props}
    >
      <span className="group-data-loading:text-transparent">
        {loadingText && isLoading ? loadingText : children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircleIcon
            className="animate-spin"
            size={16}
            aria-hidden="true"
          />
        </div>
      )}
    </Button>
  )
}

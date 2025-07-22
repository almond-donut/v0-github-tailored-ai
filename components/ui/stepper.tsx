"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Check, Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Context for Stepper
interface StepperContextProps {
  value: number
  onValueChange: (value: number) => void
  isLoading?: boolean
}

const StepperContext = React.createContext<StepperContextProps | null>(null)

function useStepperContext() {
  const context = React.useContext(StepperContext)
  if (!context) {
    throw new Error("useStepperContext must be used within a Stepper component")
  }
  return context
}

// Context for StepperItem
interface StepperItemContextProps {
  step: number
}

const StepperItemContext = React.createContext<StepperItemContextProps | null>(null)

function useStepperItemContext() {
  const context = React.useContext(StepperItemContext)
  if (!context) {
    throw new Error("useStepperItemContext must be used within a StepperItem component")
  }
  return context
}

// Stepper Component
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  onValueChange: (value: number) => void
  isLoading?: boolean
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ value, onValueChange, isLoading, className, children, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ value, onValueChange, isLoading }),
      [value, onValueChange, isLoading]
    )

    return (
      <StepperContext.Provider value={contextValue}>
        <div ref={ref} className={cn("flex w-full items-center", className)} {...props}>
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

// StepperItem Component
interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  loading?: boolean // loading is passed here but used from main context
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ step, className, children, ...props }, ref) => {
    const contextValue = React.useMemo(() => ({ step }), [step])
    return (
      <StepperItemContext.Provider value={contextValue}>
        <div ref={ref} className={cn("flex items-center", className)} {...props}>
          {children}
        </div>
      </StepperItemContext.Provider>
    )
  }
)
StepperItem.displayName = "StepperItem"

// StepperTrigger Component
const StepperTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, ref) => {
  const { onValueChange } = useStepperContext()
  const { step } = useStepperItemContext()
  const Comp = asChild ? Slot : "button"

  return (
    <Comp ref={ref} onClick={() => onValueChange(step)} {...props}>
      {children}
    </Comp>
  )
})
StepperTrigger.displayName = "StepperTrigger"

// StepperIndicator Component
const StepperIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { value, isLoading } = useStepperContext()
  const { step } = useStepperItemContext()

  const isActive = value === step
  const isCompleted = value > step

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2 font-medium transition-colors",
        isCompleted
          ? "border-primary bg-primary text-primary-foreground"
          : isActive
          ? "border-primary text-primary"
          : "border-border text-muted-foreground",
        className
      )}
      {...props}
    >
      {isLoading && isActive ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCompleted ? (
        <Check className="h-5 w-5" />
      ) : (
        step
      )}
    </div>
  )
})
StepperIndicator.displayName = "StepperIndicator"

// StepperSeparator Component
const StepperSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { value } = useStepperContext()
  const { step } = useStepperItemContext()
  const isCompleted = value > step

  return (
    <div
      ref={ref}
      className={cn(
        "h-0.5 flex-1 transition-colors",
        isCompleted ? "bg-primary" : "bg-border",
        className
      )}
      {...props}
    />
  )
})
StepperSeparator.displayName = "StepperSeparator"

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
}
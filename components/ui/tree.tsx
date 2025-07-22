"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
  indent?: number
}

interface TreeItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isExpanded?: boolean
  isFolder?: boolean
  level?: number
  indent?: number
}

interface TreeItemLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const Tree = React.forwardRef<HTMLDivElement, TreeProps>(
  ({ className, indent = 20, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        style={{ "--tree-indent": `${indent}px` } as React.CSSProperties}
        {...props}
      />
    )
  }
)
Tree.displayName = "Tree"

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
  ({ className, level = 0, indent = 20, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        style={{ paddingLeft: `${level * indent}px` }}
        {...props}
      />
    )
  }
)
TreeItem.displayName = "TreeItem"

const TreeItemLabel = React.forwardRef<HTMLDivElement, TreeItemLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md transition-colors",
          className
        )}
        {...props}
      />
    )
  }
)
TreeItemLabel.displayName = "TreeItemLabel"

export { Tree, TreeItem, TreeItemLabel }

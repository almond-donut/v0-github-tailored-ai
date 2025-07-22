"use client"

import React, { useState, useEffect } from "react"
import { hotkeysCoreFeature, asyncDataLoaderFeature } from "@headless-tree/core"
import { useTree, ItemInstance } from "@headless-tree/react"
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react"
import { Tree, TreeItem, TreeItemLabel } from "./ui/tree"
import { getGitHubAPI } from "@/lib/github"
import { GitHubRepository } from "@/lib/supabase"

interface Item {
  id: string
  name: string
  children?: string[]
  isRepo: boolean
  owner?: string
}

const indent = 20

export default function RepositoryTree() {
  const [items, setItems] = useState<Record<string, Item>>({})

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const api = await getGitHubAPI()
        const repos = await api.getAllUserRepositories()
        const repoItems: Record<string, Item> = {
          root: {
            id: "root",
            name: "Repositories",
            children: repos.map((repo) => repo.full_name),
            isRepo: false,
          },
        }
        repos.forEach((repo) => {
          repoItems[repo.full_name] = {
            id: repo.full_name,
            name: repo.name,
            children: [],
            isRepo: true,
            owner: repo.owner.login,
          }
        })
        setItems(repoItems)
      } catch (error) {
        console.error("Error fetching repositories:", error)
      }
    }
    fetchRepos()
  }, [])

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ["root"],
    },
    indent,
    rootItemId: "root",
    getItemName: (item: { getItemData: () => Item }) => item.getItemData().name,
    isItemFolder: (item: { getItemData: () => Item }) => (item.getItemData()?.children?.length ?? 0) > 0 || item.getItemData().isRepo,
    dataLoader: {
      getItem: (itemId: string) => items[itemId],
      getChildren: async (itemId: string) => {
        const item = items[itemId]
        if (!item) {
          return []
        }
        if (item.isRepo && item.owner) {
          try {
            const api = await getGitHubAPI()
            const branches = await api.getBranches(item.owner, item.name)
            const branchItems = branches.map((branch: any) => ({
              id: `${itemId}/${branch.name}`,
              name: branch.name,
              isRepo: false,
            }))
            const newItems = { ...items }
            branchItems.forEach((branch) => {
              newItems[branch.id] = branch
            })
            newItems[itemId].children = branchItems.map((b) => b.id)
            setItems(newItems)
            return newItems[itemId].children ?? []
          } catch (error) {
            console.error("Error fetching branches:", error)
            return []
          }
        }
        return items[itemId].children ?? []
      },
    },
    features: [asyncDataLoaderFeature, hotkeysCoreFeature],
  })

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <div>
        <Tree
          className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
          indent={indent}
        >
          {tree.getItems().map((item: ItemInstance<Item>) => {
            return (
              <TreeItem
                key={item.getId()}
                level={item.getLevel()}
                isExpanded={item.isExpanded()}
                isFolder={item.isFolder()}
                onClick={() => item.toggleExpanded()}
              >
                <TreeItemLabel className="before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10">
                  <span className="flex items-center gap-2">
                    {item.isFolder() ? (
                      item.isExpanded() ? (
                        <FolderOpenIcon className="text-muted-foreground pointer-events-none size-4" />
                      ) : (
                        <FolderIcon className="text-muted-foreground pointer-events-none size-4" />
                      )
                    ) : (
                      <FileIcon className="text-muted-foreground pointer-events-none size-4" />
                    )}
                    {item.getItemName()}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            )
          })}
        </Tree>
      </div>
    </div>
  )
}

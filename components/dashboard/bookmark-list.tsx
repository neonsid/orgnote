'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'
import { Copy, Pencil, Trash2, FolderInput } from 'lucide-react'

interface Bookmark {
  id: string
  title: string
  domain: string
  url: string
  favicon: string | null
  fallbackColor: string
  createdAt: string
  groupId: string
}

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onCopy: (bookmark: Bookmark) => void
  onRename: (bookmark: Bookmark) => void
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmark: Bookmark) => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function FaviconIcon({ bookmark }: { bookmark: Bookmark }) {
  const [imgError, setImgError] = useState(false)

  if (bookmark.favicon && !imgError) {
    return (
      <div className="size-7 rounded-lg overflow-hidden shrink-0 border border-border bg-background flex items-center justify-center">
        <Image
          src={bookmark.favicon}
          alt=""
          width={20}
          height={20}
          className="size-5 rounded-sm"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }

  return (
    <div
      className="size-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: bookmark.fallbackColor }}
    >
      {bookmark.title.charAt(0).toUpperCase()}
    </div>
  )
}

export function BookmarkList({
  bookmarks,
  onCopy,
  onRename,
  onDelete,
  onMove,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm font-medium">No bookmarks found</p>
        <p className="text-xs mt-1">
          Try a different search or press Enter to add
        </p>
      </div>
    )
  }

  return (
    <div className="w-full px-2 mb-8">
      <div className="hidden sm:flex items-center px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <span className="flex-1">Title</span>
        <span className="w-24 text-right">Created At</span>
      </div>

      <div className="px-4">
        <hr className="bg-black dark:bg-gray-100 my-1" />
      </div>
      <div>
        {bookmarks.map((bookmark) => (
          <ContextMenu key={bookmark.id}>
            <ContextMenuTrigger asChild>
              <a
                id={`bookmark-${bookmark.id}`}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-muted/50 rounded-lg mx-1 transition-colors group cursor-pointer"
              >
                <FaviconIcon bookmark={bookmark} />
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {bookmark.title}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {bookmark.domain}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {formatDate(bookmark.createdAt)}
                </span>
              </a>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => onCopy(bookmark)}>
                <Copy className="size-4 mr-2" />
                Copy
                <ContextMenuShortcut className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    ⌘
                  </kbd>
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    C
                  </kbd>
                </ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onRename(bookmark)}>
                <Pencil className="size-4 mr-2" />
                Rename
                <ContextMenuShortcut className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    ⌘
                  </kbd>
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    E
                  </kbd>
                </ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onMove(bookmark)}>
                <FolderInput className="size-4 mr-2" />
                Move to
                <ContextMenuShortcut className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    ⌘
                  </kbd>
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    M
                  </kbd>
                </ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                variant="destructive"
                onClick={() => onDelete(bookmark)}
              >
                <Trash2 className="size-4 mr-2" />
                Delete
                <ContextMenuShortcut className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    ⌘
                  </kbd>
                  <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                    ⌫
                  </kbd>
                </ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, Variants } from 'motion/react'
import { Shimmer } from '@/components/ai-elements/shimmer'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import { Copy, Pencil, Trash2, ChevronsRightIcon } from 'lucide-react'
import { ConvexGroup, FALLBACK_COLORS } from './group-selector'
import { Id } from '@/convex/_generated/dataModel'

interface Bookmark {
  id: Id<'bookmarks'>
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
  groups: ConvexGroup[]
  loading: boolean
  onCopy: (bookmark: Bookmark) => void
  onRename: (bookmark: Bookmark) => void
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmarkId: Id<'bookmarks'>, newGroupId: Id<'groups'>) => void
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

// Smoother, slower animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Slower stagger (80ms between items)
      delayChildren: 0.15, // Wait 150ms before starting
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16, // Start slightly lower
    scale: 0.98, // Slight scale down for depth
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5, // Slower duration (500ms)
      ease: [0.25, 0.1, 0.25, 1] as const, // Smooth cubic-bezier ease-out
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

export function BookmarkList({
  bookmarks,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
  loading,
}: BookmarkListProps) {
  const showLoading = loading && bookmarks.length === 0
  const hasBookmarks = bookmarks.length > 0

  if (showLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <Shimmer duration={2}>Loading Bookmarks...</Shimmer>
      </motion.div>
    )
  }

  if (!hasBookmarks && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <p className="text-sm font-medium">No bookmarks found</p>
        <p className="text-xs mt-1">
          Try a different search or press Enter to add
        </p>
      </motion.div>
    )
  }

  return (
    <div className="w-full px-2 mb-8">
      <motion.div
        variants={headerVariants as Variants}
        initial="hidden"
        animate="show"
        className="hidden sm:flex items-center px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
      >
        <span className="flex-1">Title</span>
        <span className="w-24 text-right">Created At</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        className="px-4 origin-left"
      >
        <hr className="bg-black dark:bg-gray-100 my-1" />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative"
      >
        <AnimatePresence mode="popLayout">
          {bookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              variants={itemVariants}
              layout
              exit={{
                opacity: 0,
                scale: 0.95,
                y: -10,
                transition: { duration: 0.3, ease: 'easeInOut' },
              }}
            >
              <ContextMenu>
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
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="flex items-center">
                      <ChevronsRightIcon className="size-4 mr-2" />
                      Move to
                    </ContextMenuSubTrigger>

                    <ContextMenuSubContent className="w-48">
                      {groups
                        .filter((group) => group._id !== bookmark.groupId)
                        .map((group, i) => (
                          <ContextMenuItem
                            key={group._id}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => onMove(bookmark.id, group._id)}
                          >
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  group.color ||
                                  FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                              }}
                            />
                            <span className="flex-1 text-left font-medium">
                              {group.title}
                            </span>
                          </ContextMenuItem>
                        ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
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
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

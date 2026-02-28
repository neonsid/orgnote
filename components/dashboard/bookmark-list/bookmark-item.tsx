import { memo } from 'react'
import { motion } from 'motion/react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FaviconIcon } from './favicon-icon'
import { DesktopMenu, MobileMenu } from './menu'
import { formatDate, KEYBOARD_SHORTCUTS } from './constants'
import type { Bookmark } from './types'
import type { ConvexGroup } from '../group-selector'
import type { Id } from '@/convex/_generated/dataModel'

interface BookmarkItemProps {
  bookmark: Bookmark
  groups: ConvexGroup[]
  isMobile: boolean
  isPopoverOpen: boolean
  onPopoverOpenChange: (open: boolean) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onCopy: () => void
  onRename: () => void
  onDelete: () => void
  onMove: (groupId: Id<'groups'>) => void
  onToggleRead: () => void
}

export const BookmarkItem = memo(function BookmarkItem({
  bookmark,
  groups,
  isMobile,
  isPopoverOpen,
  onPopoverOpenChange,
  onTouchStart,
  onTouchEnd,
  onMouseEnter,
  onMouseLeave,
  onCopy,
  onRename,
  onDelete,
  onMove,
  onToggleRead,
}: BookmarkItemProps) {
  const content = (
    <>
      <FaviconIcon bookmark={bookmark} />

      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span
          className={`font-medium text-sm truncate group-hover:text-primary transition-colors ${
            bookmark.doneReading ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {bookmark.title}
        </span>
        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
          {bookmark.domain}
        </span>
      </div>

      <span className="text-xs text-muted-foreground tabular-nums shrink-0 group-hover:hidden">
        {formatDate(bookmark.createdAt)}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden group-hover:flex items-center gap-1">
        {KEYBOARD_SHORTCUTS.open.map((key, index) => (
          <kbd
            key={index}
            className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded bg-muted border border-border text-[10px] font-medium"
          >
            {key}
          </kbd>
        ))}
      </span>
    </>
  )

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
      >
        <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
          <PopoverTrigger asChild>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onTouchMove={onTouchEnd}
              onClick={(e) => {
                if (isPopoverOpen) {
                  e.preventDefault()
                }
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
            >
              {content}
            </a>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
            <MobileMenu
              bookmark={bookmark}
              groups={groups}
              onCopy={onCopy}
              onRename={onRename}
              onDelete={onDelete}
              onMove={onMove}
              onToggleRead={onToggleRead}
              onClose={() => onPopoverOpenChange(false)}
            />
          </PopoverContent>
        </Popover>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
          >
            {content}
          </a>
        </ContextMenuTrigger>
        <DesktopMenu
          bookmark={bookmark}
          groups={groups}
          onCopy={onCopy}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
          onToggleRead={onToggleRead}
        />
      </ContextMenu>
    </motion.div>
  )
})

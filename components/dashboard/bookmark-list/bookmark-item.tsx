import { memo, useState, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  onContextMenu?: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  onMove: (groupId: Id<'groups'>) => void
  onToggleRead: () => void
  onShowDescription?: () => void
  showDescription?: boolean
  isSelected?: boolean
}

export const BookmarkItem = memo(function BookmarkItem({
  bookmark,
  groups,
  isMobile,
  isPopoverOpen,
  onPopoverOpenChange,
  onTouchStart,
  onTouchEnd,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  onCopy,
  onEdit,
  onDelete,
  onMove,
  onToggleRead,
  onShowDescription,
  showDescription,
  isSelected,
}: BookmarkItemProps) {
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const hasDescription = !!bookmark.description

  // Open dialog when showDescription prop is triggered (from keyboard shortcut)
  useEffect(() => {
    if (showDescription && hasDescription) {
      setDescriptionOpen(true)
    }
  }, [showDescription, hasDescription])

  // Handle external trigger to show description (from keyboard shortcut)
  const handleExternalShowDescription = useCallback(() => {
    if (hasDescription) {
      setDescriptionOpen(true)
      onShowDescription?.()
    }
  }, [hasDescription, onShowDescription])

  // Handle menu trigger to show description
  const handleMenuShowDescription = useCallback(() => {
    if (hasDescription) {
      setDescriptionOpen(true)
    }
  }, [hasDescription])

  const mainContent = (
    <>
      <FaviconIcon bookmark={bookmark} />

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
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

        {hasDescription && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {bookmark.description}
          </p>
        )}
      </div>

      <span className="text-xs text-muted-foreground tabular-nums shrink-0 group-hover:hidden self-start mt-1">
        {formatDate(bookmark.createdAt)}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden group-hover:flex items-center gap-1 self-start mt-1">
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

  const selectionClass = isSelected
    ? 'bg-ring/10 ring-2 ring-ring ring-inset'
    : ''

  if (isMobile) {
    return (
      <>
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
                onContextMenu={onContextMenu}
                onClick={(e) => {
                  if (isPopoverOpen) {
                    e.preventDefault()
                  }
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`flex items-start gap-3 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer ${selectionClass}`}
              >
                {mainContent}
              </a>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
              <MobileMenu
                bookmark={bookmark}
                groups={groups}
                onCopy={onCopy}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onToggleRead={onToggleRead}
                onShowDescription={handleMenuShowDescription}
                onClose={() => onPopoverOpenChange(false)}
              />
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Mobile Description Dialog */}
        <Dialog open={descriptionOpen} onOpenChange={setDescriptionOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FaviconIcon bookmark={bookmark} />
                <span className="truncate">{bookmark.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bookmark.description}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const linkContent = (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer ${selectionClass}`}
    >
      {mainContent}
    </a>
  )

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>{linkContent}</ContextMenuTrigger>
          <DesktopMenu
            bookmark={bookmark}
            groups={groups}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
            onToggleRead={onToggleRead}
            onShowDescription={handleMenuShowDescription}
          />
        </ContextMenu>
      </motion.div>

      {/* Desktop Description Dialog */}
      <Dialog open={descriptionOpen} onOpenChange={setDescriptionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaviconIcon bookmark={bookmark} />
              <span className="truncate">{bookmark.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {bookmark.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})

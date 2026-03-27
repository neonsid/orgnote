import { memo, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { DesktopMenu, MobileMenu } from './menu'
import { BookmarkRowMain } from './bookmark-row-main'
import { BookmarkDescriptionDialog } from './bookmark-description-dialog'
import { cn } from '@/lib/utils'
import type { Bookmark } from './types'
import type { ConvexGroup } from '../group-selector'
import type { Id } from '@/convex/_generated/dataModel'

interface BookmarkItemProps {
  bookmark: Bookmark
  groups: ConvexGroup[]
  isMobile: boolean
  isKeyboardFocused?: boolean
  multiSelectMode: boolean
  isMultiSelected: boolean
  onToggleMultiSelect: () => void
  onEnterMultiSelect: () => void
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
  onClearDescriptionRequest?: () => void
}

export const BookmarkItem = memo(function BookmarkItem({
  bookmark,
  groups,
  isMobile,
  isKeyboardFocused,
  multiSelectMode,
  isMultiSelected,
  onToggleMultiSelect,
  onEnterMultiSelect,
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
  onShowDescription: _onShowDescription,
  showDescription,
  onClearDescriptionRequest,
}: BookmarkItemProps) {
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const hasDescription = !!bookmark.description

  const descriptionDialogOpen =
    (showDescription && hasDescription) || descriptionOpen

  const handleDescriptionOpenChange = useCallback(
    (open: boolean) => {
      setDescriptionOpen(open)
      if (!open) onClearDescriptionRequest?.()
    },
    [onClearDescriptionRequest],
  )

  const handleMenuShowDescription = useCallback(() => {
    if (hasDescription) {
      setDescriptionOpen(true)
    }
  }, [hasDescription])

  const rowClass = cn(
    'flex items-start gap-3 rounded-lg transition-colors group cursor-pointer',
    isMobile ? 'py-2 px-3 hover:bg-muted/50' : 'p-2 hover:bg-muted/50',
    isKeyboardFocused &&
      !multiSelectMode &&
      'bg-ring/10 ring-2 ring-ring ring-inset',
  )

  const rowLeading = multiSelectMode ? (
    <span className="flex size-7 shrink-0 items-center justify-center">
      <Checkbox
        checked={isMultiSelected}
        onCheckedChange={() => onToggleMultiSelect()}
        aria-label={isMultiSelected ? 'Deselect bookmark' : 'Select bookmark'}
      />
    </span>
  ) : undefined

  function isEventFromCheckbox(target: EventTarget | null) {
    return (
      target instanceof Element &&
      Boolean(target.closest('[data-slot="checkbox"]'))
    )
  }

  const handleRowClick = (e: React.MouseEvent) => {
    if (!multiSelectMode) return
    e.preventDefault()
    if (isEventFromCheckbox(e.target)) return
    onToggleMultiSelect()
  }

  const menuProps = {
    bookmark,
    groups,
    onCopy,
    onEdit,
    onDelete,
    onMove,
    onToggleRead,
    onShowDescription: handleMenuShowDescription,
    onEnterMultiSelect,
  }

  return (
    <>
      {isMobile ? (
        multiSelectMode ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggleMultiSelect()
                }
              }}
              onClick={handleRowClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              className={cn(rowClass, 'text-left w-full')}
            >
              <BookmarkRowMain bookmark={bookmark} leading={rowLeading} />
            </div>
          </motion.div>
        ) : (
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
                  className={rowClass}
                >
                  <BookmarkRowMain bookmark={bookmark} leading={rowLeading} />
                </a>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto max-h-[min(90dvh,32rem)] overflow-y-auto overscroll-contain p-0"
                align="start"
                sideOffset={4}
              >
                <MobileMenu
                  {...menuProps}
                  onClose={() => onPopoverOpenChange(false)}
                  isOpen={isPopoverOpen}
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )
      ) : (
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              {multiSelectMode ? (
                <div
                  role="button"
                  tabIndex={0}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  onClick={handleRowClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggleMultiSelect()
                    }
                  }}
                  className={rowClass}
                >
                  <BookmarkRowMain bookmark={bookmark} leading={rowLeading} />
                </div>
              ) : (
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  className={rowClass}
                >
                  <BookmarkRowMain bookmark={bookmark} leading={rowLeading} />
                </a>
              )}
            </ContextMenuTrigger>
            <DesktopMenu {...menuProps} />
          </ContextMenu>
        </motion.div>
      )}

      <BookmarkDescriptionDialog
        open={descriptionDialogOpen}
        onOpenChange={handleDescriptionOpenChange}
        bookmark={bookmark}
      />
    </>
  )
})

'use client'

import { useReducer, useRef, useCallback, memo } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { m, AnimatePresence } from 'motion/react'
import { useIsSmallMobile } from '@/hooks/use-mobile'
import { BookmarkItem } from './bookmark-item'
import { MultiSelectToolbar } from './multi-select-toolbar'
import { useBookmarkShortcuts } from './use-bookmark-shortcuts'
import type { Bookmark } from './types'
import type { ConvexGroup } from '../group-selector'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  groups: ConvexGroup[]
  loading: boolean
  effectiveGroupId: Id<'groups'>
  multiSelectMode: boolean
  selectedBookmarkIds: Set<Id<'bookmarks'>>
  allVisibleBookmarksSelected: boolean
  onToggleMultiSelect: (bookmarkId: Id<'bookmarks'>) => void
  onEnterMultiSelect: (bookmarkId: Id<'bookmarks'>) => void
  onExitMultiSelect: () => void
  onSelectAllVisibleBookmarks: () => void
  onMoveSelectedBookmarks: (newGroupId: Id<'groups'>) => void
  onCopySelectedUrls: () => void
  onExportSelectedBookmarks: (format: 'json' | 'csv') => void
  onDeleteSelectedBookmarks: () => void
  onCopy: (bookmark: Bookmark) => void
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmarkId: Id<'bookmarks'>, newGroupId: Id<'groups'>) => void
  onToggleRead: (bookmarkId: Id<'bookmarks'>) => void
}

export const BookmarkList = memo(function BookmarkList({
  bookmarks,
  groups,
  loading,
  effectiveGroupId,
  multiSelectMode,
  selectedBookmarkIds,
  allVisibleBookmarksSelected,
  onToggleMultiSelect,
  onEnterMultiSelect,
  onExitMultiSelect,
  onSelectAllVisibleBookmarks,
  onMoveSelectedBookmarks,
  onCopySelectedUrls,
  onExportSelectedBookmarks,
  onDeleteSelectedBookmarks,
  onCopy,
  onEdit,
  onDelete,
  onMove,
  onToggleRead,
}: BookmarkListProps) {
  type ListState = {
    openPopoverId: string | null
    showDescriptionId: string | null
    selectedIndex: number
  }

  type ListAction =
    | { type: 'setOpenPopover'; id: string | null }
    | { type: 'showDescription'; id: string }
    | { type: 'clearDescription' }
    | { type: 'selectNext' }
    | { type: 'selectPrevious' }
    | { type: 'clearSelection' }

  function reducer(state: ListState, action: ListAction): ListState {
    switch (action.type) {
      case 'setOpenPopover':
        return { ...state, openPopoverId: action.id }
      case 'showDescription':
        return { ...state, showDescriptionId: action.id }
      case 'clearDescription':
        return { ...state, showDescriptionId: null }
      case 'selectNext':
        return {
          ...state,
          selectedIndex: Math.min(
            state.selectedIndex + 1,
            bookmarks.length - 1
          ),
        }
      case 'selectPrevious':
        return {
          ...state,
          selectedIndex: Math.max(state.selectedIndex - 1, 0),
        }
      case 'clearSelection':
        return { ...state, selectedIndex: -1 }
      default:
        return state
    }
  }

  const isSmallMobile = useIsSmallMobile()
  const multiSelectModeRef = useRef(multiSelectMode)
  // Latest flag for mount-only keydown listener — same pattern as use-bookmark-shortcuts / .agents use-effect skill (no useEffect sync).
  // eslint-disable-next-line react-hooks/refs
  multiSelectModeRef.current = multiSelectMode

  const [state, dispatch] = useReducer(reducer, {
    openPopoverId: null,
    showDescriptionId: null,
    selectedIndex: -1,
  })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const bookmarksLengthRef = useRef(bookmarks.length)
  // Keep latest length for the global keydown listener (registered once in useMountEffect).
  // eslint-disable-next-line react-hooks/refs -- sync latest value for event handler closure
  bookmarksLengthRef.current = bookmarks.length

  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const schedulePopoverAutoClose = useCallback((id: string | null) => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current)
      autoCloseTimer.current = null
    }
    if (id && isSmallMobile) {
      autoCloseTimer.current = setTimeout(() => {
        dispatch({ type: 'setOpenPopover', id: null })
      }, 4000)
    }
  }, [isSmallMobile])

  useMountEffect(() => {
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current)
    }
  })

  const { setHoveredBookmark } = useBookmarkShortcuts({
    multiSelectModeRef,
    onEdit,
    onCopy,
    onDelete,
    onShowDescription: useCallback((bookmark: Bookmark) => {
      if (bookmark.description) {
        dispatch({ type: 'showDescription', id: bookmark.id })
        setTimeout(() => dispatch({ type: 'clearDescription' }), 3000)
      }
    }, []),
  })

  const longPressTriggered = useRef(false)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!isSmallMobile || multiSelectMode) return
      longPressTriggered.current = false

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        dispatch({ type: 'setOpenPopover', id })
        schedulePopoverAutoClose(id)
      }, 500)
    },
    [isSmallMobile, multiSelectMode, schedulePopoverAutoClose]
  )

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isSmallMobile) {
        e.preventDefault()
      }
    },
    [isSmallMobile]
  )

  const onExitMultiSelectRef = useRef(onExitMultiSelect)
  // eslint-disable-next-line react-hooks/refs -- latest handler for mount-only keydown listener
  onExitMultiSelectRef.current = onExitMultiSelect

  useMountEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!bookmarksLengthRef.current) return

      if (multiSelectModeRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          onExitMultiSelectRef.current()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        dispatch({ type: 'selectNext' })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        dispatch({ type: 'selectPrevious' })
      } else if (e.key === 'Escape') {
        e.preventDefault()
        dispatch({ type: 'clearSelection' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (loading && bookmarks.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full space-y-1"
      >
        {(
          ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"] as const
        ).map((sk) => (
          <div key={sk} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="size-5 rounded bg-muted" />
            <div className="flex-1 flex items-center gap-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted hidden sm:block" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </m.div>
    )
  }

  if (!loading && bookmarks.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <p className="text-sm font-medium">No bookmarks found</p>
        <p className="text-xs mt-1">
          Try a different search or press Enter to add
        </p>
      </m.div>
    )
  }

  return (
    <div className={cn('w-full', multiSelectMode && 'flex flex-col')}>
      <AnimatePresence mode="popLayout">
        {bookmarks.map((bookmark, index) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            groups={groups}
            isMobile={isSmallMobile}
            isKeyboardFocused={state.selectedIndex === index}
            multiSelectMode={multiSelectMode}
            isMultiSelected={selectedBookmarkIds.has(bookmark.id)}
            onToggleMultiSelect={() => onToggleMultiSelect(bookmark.id)}
            onEnterMultiSelect={() => onEnterMultiSelect(bookmark.id)}
            isPopoverOpen={state.openPopoverId === bookmark.id}
            onPopoverOpenChange={(open) => {
              dispatch({
                type: 'setOpenPopover',
                id: open ? bookmark.id : null,
              })
              if (open) schedulePopoverAutoClose(bookmark.id)
              else schedulePopoverAutoClose(null)
            }}
            onTouchStart={(e) => handleTouchStart(e, bookmark.id)}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setHoveredBookmark(bookmark)}
            onMouseLeave={() => setHoveredBookmark(null)}
            onCopy={() => onCopy(bookmark)}
            onEdit={() => onEdit(bookmark)}
            onDelete={() => onDelete(bookmark)}
            onMove={(groupId) => onMove(bookmark.id, groupId)}
            onToggleRead={() => onToggleRead(bookmark.id)}
            onShowDescription={() => {
              if (bookmark.description) {
                dispatch({ type: 'showDescription', id: bookmark.id })
                setTimeout(() => dispatch({ type: 'clearDescription' }), 3000)
              }
            }}
            showDescription={state.showDescriptionId === bookmark.id}
            onClearDescriptionRequest={() =>
              dispatch({ type: 'clearDescription' })
            }
          />
        ))}
      </AnimatePresence>

      {multiSelectMode && (
        <MultiSelectToolbar
          currentGroupId={effectiveGroupId}
          groups={groups}
          allVisibleSelected={allVisibleBookmarksSelected}
          onSelectAll={onSelectAllVisibleBookmarks}
          onMove={onMoveSelectedBookmarks}
          onCopyUrls={onCopySelectedUrls}
          onExport={onExportSelectedBookmarks}
          onDelete={onDeleteSelectedBookmarks}
          onClose={onExitMultiSelect}
        />
      )}
    </div>
  )
})

// Re-export types for backwards compatibility
export type { Bookmark } from './types'

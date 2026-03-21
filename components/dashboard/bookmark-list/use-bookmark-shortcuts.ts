import { useEffect, useRef, useCallback } from 'react'
import type { Bookmark } from './types'

// TODO: Fix this nonsense
interface UseBookmarkShortcutsOptions {
  onDelete: (bookmark: Bookmark) => void
  onShowDescription?: (bookmark: Bookmark) => void
  onEdit?: (bookmark: Bookmark) => void
  onCopy?: (bookmark: Bookmark) => void
}

export function useBookmarkShortcuts({
  onDelete,
  onShowDescription,
  onEdit,
  onCopy,
}: UseBookmarkShortcutsOptions) {
  const hoveredBookmarkRef = useRef<Bookmark | null>(null)

  const onDeleteRef = useRef(onDelete)
  const onShowDescriptionRef = useRef(onShowDescription)
  const onEditRef = useRef(onEdit)
  const onCopyRef = useRef(onCopy)

  onDeleteRef.current = onDelete
  onShowDescriptionRef.current = onShowDescription
  onEditRef.current = onEdit
  onCopyRef.current = onCopy

  const setHoveredBookmark = useCallback((bookmark: Bookmark | null) => {
    hoveredBookmarkRef.current = bookmark
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (hoveredBookmarkRef.current) {
          window.open(
            hoveredBookmarkRef.current.url,
            '_blank',
            'noopener,noreferrer'
          )
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        if (hoveredBookmarkRef.current && onEditRef.current) {
          onEditRef.current(hoveredBookmarkRef.current)
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        if (hoveredBookmarkRef.current && onCopyRef.current) {
          onCopyRef.current(hoveredBookmarkRef.current)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault()
        if (hoveredBookmarkRef.current) {
          onDeleteRef.current(hoveredBookmarkRef.current)
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault()
        if (hoveredBookmarkRef.current && onShowDescriptionRef.current) {
          onShowDescriptionRef.current(hoveredBookmarkRef.current)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { hoveredBookmarkRef, setHoveredBookmark }
}

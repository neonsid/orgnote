import { useRef, useCallback } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
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

  // eslint-disable-next-line react-hooks/refs -- latest handler refs for stable keydown listener
  onDeleteRef.current = onDelete
  // eslint-disable-next-line react-hooks/refs
  onShowDescriptionRef.current = onShowDescription
  // eslint-disable-next-line react-hooks/refs
  onEditRef.current = onEdit
  // eslint-disable-next-line react-hooks/refs
  onCopyRef.current = onCopy

  const setHoveredBookmark = useCallback((bookmark: Bookmark | null) => {
    hoveredBookmarkRef.current = bookmark
  }, [])

  useMountEffect(() => {
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
  })

  return { hoveredBookmarkRef, setHoveredBookmark }
}

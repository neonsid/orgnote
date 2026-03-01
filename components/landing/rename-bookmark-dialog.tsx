'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type LandingBookmark } from '@/components/landing/bookmark-list'

interface LandingRenameBookmarkDialogProps {
  bookmark: LandingBookmark | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (bookmarkId: string, newTitle: string) => void
}

export function LandingRenameBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
  onConfirm,
}: LandingRenameBookmarkDialogProps) {
  const [newTitle, setNewTitle] = useState(() => bookmark?.title ?? '')

  // Sync the input when a new bookmark is selected
  useEffect(() => {
    if (bookmark) {
      // Use requestAnimationFrame to avoid setState during render warning
      requestAnimationFrame(() => {
        setNewTitle(bookmark.title)
      })
    }
  }, [bookmark])

  const handleConfirm = useCallback(() => {
    if (!bookmark || !newTitle.trim()) return
    onConfirm(bookmark.id, newTitle.trim())
    onOpenChange(false)
  }, [bookmark, newTitle, onConfirm, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Bookmark</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Bookmark title"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

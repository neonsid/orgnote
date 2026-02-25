'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Bookmark {
  id: Id<'bookmarks'>
  title: string
}

interface RenameBookmarkDialogProps {
  bookmark: Bookmark | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
}: RenameBookmarkDialogProps) {
  const [newTitle, setNewTitle] = useState('')
  const renameBookmark = useMutation(api.bookmarks.renameBookMark)

  // Sync the input when a new bookmark is selected
  useEffect(() => {
    if (bookmark) {
      setNewTitle(bookmark.title)
    }
  }, [bookmark])

  const handleConfirm = useCallback(async () => {
    if (!bookmark || !newTitle.trim()) return
    await renameBookmark({
      bookmarkId: bookmark.id,
      title: newTitle.trim(),
    })
    onOpenChange(false)
  }, [bookmark, newTitle, renameBookmark, onOpenChange])

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

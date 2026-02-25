'use client'

import { useCallback } from 'react'
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

interface Bookmark {
  id: Id<'bookmarks'>
  title: string
}

interface DeleteBookmarkDialogProps {
  bookmark: Bookmark | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
}: DeleteBookmarkDialogProps) {
  const deleteBookmark = useMutation(api.bookmarks.deleteBookMark)

  const handleConfirm = useCallback(async () => {
    if (!bookmark) return
    await deleteBookmark({ bookmarkId: bookmark.id })
    onOpenChange(false)
  }, [bookmark, deleteBookmark, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Bookmark</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{bookmark?.title}&quot;? This
            action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { type Id } from '@/convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteBookmarkDialogProps {
  bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'> | null
  title: string | null
  variant: 'Bookmark' | 'File'
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
  /** When set, confirms deletion of this many bookmarks (single-item fields ignored for copy). */
  bulkBookmarkCount?: number
}

export function DeleteBookmarkDialog({
  bookmarkOrFileId,
  title,
  open,
  variant,
  onOpenChange,
  onDelete,
  bulkBookmarkCount,
}: DeleteBookmarkDialogProps) {
  const isBulkBookmarks =
    variant === 'Bookmark' &&
    bulkBookmarkCount !== undefined &&
    bulkBookmarkCount > 0

  async function handleConfirm() {
    if (isBulkBookmarks) {
      await onDelete()
      onOpenChange(false)
      return
    }
    if (!bookmarkOrFileId) return
    await onDelete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {isBulkBookmarks ? 'Delete bookmarks' : `Delete ${variant}`}
          </DialogTitle>
        </DialogHeader>
        {isBulkBookmarks ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete {bulkBookmarkCount} bookmark
            {bulkBookmarkCount === 1 ? '' : 's'}? This action cannot be undone.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete &quot;{title}&quot;? This action
            cannot be undone.
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

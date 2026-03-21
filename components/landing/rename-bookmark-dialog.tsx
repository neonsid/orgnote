'use client'

import { useState } from 'react'
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
  // Key-based reset - when bookmark changes, input resets via key prop
  const [editedTitle, setEditedTitle] = useState(bookmark?.title ?? '')

  // Sync state when bookmark changes or dialog opens
  const currentTitle = bookmark?.title ?? ''
  const displayValue =
    editedTitle !== currentTitle && !open ? currentTitle : editedTitle

  const handleConfirm = () => {
    if (!bookmark?.id || !displayValue.trim()) return
    onConfirm(bookmark.id, displayValue.trim())
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setEditedTitle(currentTitle)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEditedTitle(currentTitle)
    } else {
      setEditedTitle(currentTitle)
    }
    onOpenChange(newOpen)
  }

  // Don't render when closed and no bookmark
  if (!open && !bookmark) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Bookmark</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={displayValue}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Bookmark title"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus={open}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

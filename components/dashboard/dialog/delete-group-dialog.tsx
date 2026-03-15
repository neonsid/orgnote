'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupTitle: string
  groupColor: string
  onDeleted?: (deletedGroupId: string) => void
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  groupId,
  groupTitle,
  groupColor,
  onDeleted,
}: DeleteGroupDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteGroup = useMutation(api.groups.deleteGroup)

  async function handleDelete() {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      await deleteGroup({
        groupId: groupId as Id<'groups'>,
      })
      onOpenChange(false)
      onDeleted?.(groupId)
    } catch (err) {
      console.error('Failed to delete group:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Delete Group
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this group?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <span
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: groupColor }}
          />
          <span className="font-medium text-foreground">{groupTitle}</span>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

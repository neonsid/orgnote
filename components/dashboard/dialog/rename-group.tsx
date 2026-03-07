'use client'

import { useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'
import { useForm } from '@tanstack/react-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  renameBookmarkSchema,
  type RenameBookmarkFormData,
} from '@/lib/validation'
import { toast } from 'sonner'

interface RenameGroupDialogProps {
  groupId: Id<'groups'>
  title: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function RenameGroupDialog({
  groupId,
  open,
  title,
  onOpenChange,
  userId,
}: RenameGroupDialogProps) {
  const renameGroup = useMutation(api.groups.renameGroup)

  const form = useForm({
    defaultValues: {
      title: '',
    } as RenameBookmarkFormData,
    validators: {
      onChange: renameBookmarkSchema,
      onSubmit: renameBookmarkSchema,
    },
    onSubmit: async ({ value }) => {
      if (!groupId || !userId) return
      await renameGroup({
        groupId: groupId,
        title: value.title,
      })
      toast.success('Bookmark renamed successfully')
      onOpenChange(false)
    },
  })

  // Sync the input when a new bookmark is selected
  useEffect(() => {
    if (groupId) {
      form.setFieldValue('title', title || '')
    }
  }, [groupId, form])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Bookmark</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <div className="py-4">
            <form.Field
              name="title"
              children={(field) => (
                <>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Bookmark title"
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => state.canSubmit}
              children={(canSubmit) => (
                <Button type="submit" disabled={!canSubmit}>
                  Save
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

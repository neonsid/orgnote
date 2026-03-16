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
import { RenameGroupFormData, renameGroupSchema } from '@/lib/validation'
import { toast } from 'sonner'
import { GROUP_COLORS } from './create-group-dialog'
import { Check } from 'lucide-react'

interface RenameGroupDialogProps {
  groupId: Id<'groups'>
  title: string | undefined
  color: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameGroupDialog({
  groupId,
  open,
  title,
  color,
  onOpenChange,
}: RenameGroupDialogProps) {
  const renameGroup = useMutation(api.groups.renameGroup)

  const form = useForm({
    defaultValues: {
      title: title,
      color: color || GROUP_COLORS[0].value,
    } as RenameGroupFormData,
    validators: {
      onChange: renameGroupSchema,
      onSubmit: renameGroupSchema,
    },
    onSubmit: async ({ value }) => {
      if (!groupId) return
      await renameGroup({
        groupId: groupId,
        title: value.title,
        color: value.color,
      })
      toast.success('Bookmark renamed successfully')
      onOpenChange(false)
    },
  })

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
          <DialogTitle>Rename Group</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <div className="py-4 flex flex-col gap-6">
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
            <form.Field
              name="color"
              children={(field) => (
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    {GROUP_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        title={color.label}
                        onClick={() => field.handleChange(color.value)}
                        className="relative size-8 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ backgroundColor: color.value }}
                      >
                        {field.state.value === color.value && (
                          <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow-sm" />
                        )}
                        {field.state.value === color.value && (
                          <span className="absolute inset-0 rounded-full ring-2 ring-foreground/30 ring-offset-2 ring-offset-background" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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

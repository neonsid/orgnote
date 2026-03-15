'use client'

import { Loader2, Check } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from '@tanstack/react-form'
import { createGroupSchema, type CreateGroupFormData } from '@/lib/validation'

export const GROUP_COLORS = [
  { value: '#f59e0b', label: 'Amber' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#a855f7', label: 'Purple' },
]

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (groupId: string) => void
  onCreate: (args: { title: string; color: string }) => Promise<string>
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreated,
  onCreate,
}: CreateGroupDialogProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      color: GROUP_COLORS[0].value,
    } as CreateGroupFormData,
    validators: {
      onChange: createGroupSchema,
      onSubmit: createGroupSchema,
    },
    onSubmit: async ({ value }) => {
      const newGroupId = await onCreate({
        title: value.name,
        color: value.color,
      })
      form.reset()
      onOpenChange(false)
      onCreated?.(newGroupId)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create Group
          </DialogTitle>
          <DialogDescription>
            Create a new group to organize your bookmarks.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-5 pt-1"
        >
          {/* Name field */}
          <form.Field
            name="name"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor="group-name" className="font-semibold">
                  Name
                </Label>
                <Input
                  id="group-name"
                  type="text"
                  placeholder="Enter group name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Color picker */}
          <form.Field
            name="color"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-semibold">Color</Label>
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

          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={form.state.isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

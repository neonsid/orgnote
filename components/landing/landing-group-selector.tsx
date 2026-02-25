'use client'

import { useState, useCallback } from 'react'
import { Check, Plus, ChevronsUpDownIcon } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { type Group } from '@/lib/dummy-data'
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

const LANDING_GROUP_COLORS = [
  { value: '#f59e0b', label: 'Amber' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
]

interface LandingGroupSelectorProps {
  groups: Group[]
  selectedGroupId: string
  onSelect: (groupId: string) => void
  onCreateGroup: (group: Group) => void
}

export function LandingGroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  onCreateGroup,
}: LandingGroupSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(
    LANDING_GROUP_COLORS[0].value
  )

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  const handleCreate = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return

    const newGroup: Group = {
      id: `local-${Date.now()}`,
      name: trimmed,
      color: selectedColor,
      bookmarkCount: 0,
    }

    onCreateGroup(newGroup)
    onSelect(newGroup.id)

    // Reset form
    setName('')
    setSelectedColor(LANDING_GROUP_COLORS[0].value)
    setDialogOpen(false)
  }, [name, selectedColor, onCreateGroup, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleCreate()
      }
    },
    [handleCreate]
  )

  return (
    <>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            id="landing-group-selector-trigger"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedGroup?.color }}
            />
            {selectedGroup?.name}
            <ChevronsUpDownIcon
              className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 min-w-[200px] rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="p-1.5">
              {groups.map((group) => (
                <button
                  key={group.id}
                  id={`landing-group-option-${group.id}`}
                  onClick={() => {
                    onSelect(group.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="flex-1 text-left font-medium">
                    {group.name}
                  </span>
                  {group.id === selectedGroupId ? (
                    <Check className="size-4 text-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.bookmarkCount}
                    </span>
                  )}
                </button>
              ))}

              <div className="my-1 h-px bg-border" />

              <button
                id="landing-create-group-button"
                onClick={() => {
                  setOpen(false)
                  setDialogOpen(true)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                <span className="font-medium">Create Group</span>
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Ephemeral create-group dialog (no Convex, stored in local state only) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Create Group
            </DialogTitle>
            <DialogDescription>
              Create a group for this demo. It will persist until you refresh
              the page.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 pt-1">
            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="landing-group-name" className="font-semibold">
                Name
              </Label>
              <Input
                id="landing-group-name"
                type="text"
                placeholder="Enter group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Color picker */}
            <div className="grid gap-2">
              <Label className="font-semibold">Color</Label>
              <div className="flex flex-wrap gap-2">
                {LANDING_GROUP_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.label}
                    onClick={() => setSelectedColor(color.value)}
                    className="relative size-8 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{ backgroundColor: color.value }}
                  >
                    {selectedColor === color.value && (
                      <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow-sm" />
                    )}
                    {selectedColor === color.value && (
                      <span className="absolute inset-0 rounded-full ring-2 ring-foreground/30 ring-offset-2 ring-offset-background" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

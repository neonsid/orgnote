'use client'

import { Plus, Command } from 'lucide-react'

interface BookmarkSearchProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
}

export function BookmarkSearch({
  value,
  onChange,
  onSubmit,
}: BookmarkSearchProps) {
  return (
    <div className="relative flex items-center w-full">
      <Plus className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <input
        id="bookmark-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit(value.trim())
          }
        }}
        placeholder="Insert a link, color, or just plain text..."
        className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-20 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <div className="absolute right-2 flex items-center gap-1.5">
        <kbd className="inline-flex items-center justify-center size-6 rounded border border-border bg-muted text-muted-foreground text-xs">
          <Command className="size-3" />
        </kbd>
        <kbd className="inline-flex items-center justify-center size-6 rounded border border-border bg-muted text-muted-foreground text-xs font-medium">
          F
        </kbd>
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ConvexGroup } from '@/components/dashboard/group-selector'
import { FALLBACK_COLORS } from '@/components/dashboard/group-selector'
import type { Id } from '@/convex/_generated/dataModel'
import { FileCsvIcon, FileJsIcon } from '@phosphor-icons/react'
import {
  ListChecks,
  SquareMousePointer,
  CopyCheck,
  FileOutput,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

function ExportFormatMenuIcon({ format }: { format: 'csv' | 'json' }) {
  if (format === 'csv') {
    return (
      <FileCsvIcon
        size={32}
        className="shrink-0 text-foreground"
        aria-hidden
      />
    )
  }
  return (
    <FileJsIcon size={32} className="shrink-0 text-foreground" aria-hidden />
  )
}

export interface MultiSelectToolbarProps {
  currentGroupId: Id<'groups'>
  groups: ConvexGroup[]
  allVisibleSelected: boolean
  onSelectAll: () => void
  onMove: (groupId: Id<'groups'>) => void
  onCopyUrls: () => void
  onExport: (format: 'json' | 'csv') => void
  onDelete: () => void
  onClose: () => void
}

export function MultiSelectToolbar({
  currentGroupId,
  groups,
  allVisibleSelected,
  onSelectAll,
  onMove,
  onCopyUrls,
  onExport,
  onDelete,
  onClose,
}: MultiSelectToolbarProps) {
  const moveTargets = useMemo(
    () =>
      groups
        .filter((g) => g._id !== currentGroupId)
        .map((group, i) => ({
          group,
          fallbackColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        })),
    [groups, currentGroupId],
  )

  const barBtn =
    'h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium sm:text-sm sm:px-3'

  return (
    <div
      className={cn(
        'fixed z-50 flex max-w-[min(100vw-1rem,42rem)] flex-wrap items-center justify-center gap-0.5 rounded-full border bg-background px-1.5 py-1.5 shadow-lg sm:flex-nowrap sm:gap-1',
        'bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2',
      )}
      role="toolbar"
      aria-label="Bookmark selection actions"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={barBtn}
        onClick={onSelectAll}
        aria-pressed={allVisibleSelected}
        aria-label={
          allVisibleSelected ? 'Deselect all visible bookmarks' : 'Select all visible bookmarks'
        }
      >
        <ListChecks className="size-4 shrink-0" />
        <span className="hidden sm:inline">
          {allVisibleSelected ? 'Deselect all' : 'Select all'}
        </span>
        <span className="sm:hidden">{allVisibleSelected ? 'Clear' : 'All'}</span>
      </Button>

      <div className="hidden h-5 w-px bg-border sm:block" aria-hidden />

      {moveTargets.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={barBtn}
            >
              <SquareMousePointer className="size-4 shrink-0" />
              Move
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            {moveTargets.map(({ group, fallbackColor }) => (
              <DropdownMenuItem
                key={group._id}
                onClick={() => onMove(group._id as Id<'groups'>)}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: group.color || fallbackColor,
                  }}
                />
                {group.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(barBtn, 'pointer-events-none opacity-40')}
          disabled
        >
          <SquareMousePointer className="size-4 shrink-0" />
          Move
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={barBtn}
        onClick={onCopyUrls}
      >
        <CopyCheck className="size-4 shrink-0" />
        <span className="hidden sm:inline">Copy URLs</span>
        <span className="sm:hidden">URLs</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className={barBtn}>
            <FileOutput className="size-4 shrink-0" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="center" className="min-w-[11rem]">
          <DropdownMenuItem
            className="gap-2.5 py-2"
            onClick={() => onExport('csv')}
          >
            <ExportFormatMenuIcon format="csv" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 py-2"
            onClick={() => onExport('json')}
          >
            <ExportFormatMenuIcon format="json" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(barBtn, 'text-destructive hover:bg-destructive/10 hover:text-destructive')}
        onClick={onDelete}
      >
        <Trash2 className="size-4 shrink-0" />
        Delete
      </Button>

      <div className="hidden h-5 w-px bg-border sm:block" aria-hidden />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        onClick={onClose}
        aria-label="Exit selection mode"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

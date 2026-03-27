'use client'

import { memo } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParsedImportItem } from '@/lib/bookmark-import'
import { chromeFolderSelectLabel } from './parse-export-html'

type GroupRow = { _id: string; title: string; color: string }

export interface BookmarkImportStagingPanelProps {
  folderKeys: string[]
  effectiveChromeFolderKey: string
  onChromeFolderChange: (key: string) => void
  availableInFolder: ParsedImportItem[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
  groups: GroupRow[] | undefined
  effectiveTargetGroupId: string
  onTargetGroupChange: (groupId: string) => void
  targetGroupTitle: string
  onAddToGroup: () => void
  selectedInFolderCount: number
  groupsWithPending: GroupRow[]
  pendingByGroup: Record<string, ParsedImportItem[]>
  pendingGroupExpanded: Record<string, boolean>
  onPendingGroupExpandedChange: (groupId: string, expanded: boolean) => void
  onRemoveFromPending: (groupId: string, itemId: string) => void
  totalPendingCount: number
}

/** Scrollable body of the import dialog: folder picker, link list, group assignment, staged queues. */
export const BookmarkImportStagingPanel = memo(function BookmarkImportStagingPanel({
  folderKeys,
  effectiveChromeFolderKey,
  onChromeFolderChange,
  availableInFolder,
  selectedIds,
  onToggleRow,
  onSelectAll,
  onSelectNone,
  groups,
  effectiveTargetGroupId,
  onTargetGroupChange,
  targetGroupTitle,
  onAddToGroup,
  selectedInFolderCount,
  groupsWithPending,
  pendingByGroup,
  pendingGroupExpanded,
  onPendingGroupExpandedChange,
  onRemoveFromPending,
  totalPendingCount,
}: BookmarkImportStagingPanelProps) {
  const selectedSet = new Set(selectedIds)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 overflow-y-auto overscroll-y-contain border-y px-4 sm:px-6 py-3 sm:py-4">
      <div className="space-y-2 shrink-0">
        <Label>Chrome folder</Label>
        <p className="text-xs text-muted-foreground">
          Pick a folder from your export, then select links to assign to a your
          groups.
        </p>
        <Select
          value={effectiveChromeFolderKey}
          onValueChange={onChromeFolderChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Folder" />
          </SelectTrigger>
          <SelectContent>
            {folderKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {chromeFolderSelectLabel(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex max-h-[min(35vh,18rem)] min-h-[6rem] flex-col overflow-hidden rounded-md border bg-muted/5">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onSelectAll}
              disabled={availableInFolder.length === 0}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onSelectNone}
              disabled={availableInFolder.length === 0}
            >
              Select none
            </Button>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
            {availableInFolder.length} available
          </span>
        </div>
        <ul className="divide-y overflow-y-auto min-h-0 flex-1 overscroll-contain">
          {availableInFolder.length === 0 ? (
            <li className="p-4 text-center text-sm text-muted-foreground">
              No links left in this folder — change folder or remove some from
              the list below.
            </li>
          ) : (
            availableInFolder.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 px-3 py-2 hover:bg-muted/40"
              >
                <Checkbox
                  checked={selectedSet.has(item.id)}
                  onCheckedChange={() => onToggleRow(item.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-2">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.url}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="space-y-2 shrink-0">
        <Label>Your groups</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Select
            value={effectiveTargetGroupId}
            onValueChange={onTargetGroupChange}
            disabled={!groups?.length}
          >
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groups?.map((g) => (
                <SelectItem key={g._id} value={g._id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    {g.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            className="w-full sm:w-auto shrink-0"
            disabled={
              selectedInFolderCount === 0 ||
              !effectiveTargetGroupId ||
              !groups?.length
            }
            onClick={onAddToGroup}
          >
            Add to {targetGroupTitle}
          </Button>
        </div>
      </div>

      {groupsWithPending.length > 0 && (
        <div className="space-y-3 shrink-0">
          <div className="space-y-1">
            <Label>Ready to import</Label>
            <p className="text-xs text-muted-foreground">
              {groupsWithPending.length} group
              {groupsWithPending.length === 1 ? '' : 's'} · {totalPendingCount}{' '}
              link{totalPendingCount === 1 ? '' : 's'}. Expand each group to
              review links. They will be saved when you click Import selected.
            </p>
          </div>
          <div className="space-y-2">
            {groupsWithPending.map((g) => {
              const items = pendingByGroup[g._id] ?? []
              const expanded = pendingGroupExpanded[g._id] ?? true
              return (
                <Collapsible
                  key={g._id}
                  open={expanded}
                  onOpenChange={(next) =>
                    onPendingGroupExpandedChange(g._id, next)
                  }
                  className="overflow-hidden rounded-md border bg-muted/5"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
                    >
                      <ChevronDown
                        className={cn(
                          'size-4 shrink-0 text-muted-foreground transition-transform',
                          !expanded && '-rotate-90'
                        )}
                      />
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="min-w-0 truncate">{g.title}</span>
                      <span className="text-muted-foreground font-normal tabular-nums shrink-0">
                        ({items.length})
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="space-y-1 border-t border-border px-3 py-2 pl-6 sm:pl-10">
                      {items.map((item) => (
                        <li
                          key={`${g._id}-${item.id}`}
                          className="flex items-start gap-2 py-1"
                        >
                          <div className="min-w-0 flex-1 border-l-2 border-muted pl-3 -ml-0.5">
                            <p className="text-sm line-clamp-1">{item.title}</p>
                            <p className="text-xs text-muted-foreground break-all line-clamp-1">
                              {item.url}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${item.title}`}
                            onClick={() => onRemoveFromPending(g._id, item.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

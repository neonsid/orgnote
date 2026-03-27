'use client'

import { memo, type RefObject } from 'react'
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
import { m, AnimatePresence } from 'motion/react'
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
  pendingSectionRef?: RefObject<HTMLDivElement | null>
}

const listItemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.02, 0.4), duration: 0.2 },
  }),
}

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
  pendingSectionRef,
}: BookmarkImportStagingPanelProps) {
  const selectedSet = new Set(selectedIds)

  return (
    <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4">
      {/* Folder picker */}
      <div className="space-y-2.5 shrink-0">
        <Label className="text-sm font-medium">Source folder</Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pick a folder from your export, then select links to assign to your
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

      {/* Bookmark list */}
      <div className="flex max-h-[40vh] sm:max-h-[min(50vh,24rem)] min-h-[6rem] flex-col overflow-hidden rounded-lg border bg-muted/5">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2.5 text-xs"
              onClick={onSelectAll}
              disabled={availableInFolder.length === 0}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2.5 text-xs"
              onClick={onSelectNone}
              disabled={availableInFolder.length === 0}
            >
              None
            </Button>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
            {availableInFolder.length} available
          </span>
        </div>
        <ul className="divide-y overflow-y-auto min-h-0 flex-1 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
          {availableInFolder.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              No links left in this folder — change folder or remove some from
              the staged list below.
            </li>
          ) : (
            availableInFolder.map((item, i) => (
              <m.li
                key={item.id}
                custom={i}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => onToggleRow(item.id)}
              >
                <Checkbox
                  checked={selectedSet.has(item.id)}
                  onCheckedChange={() => onToggleRow(item.id)}
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.url}
                  </p>
                </div>
              </m.li>
            ))
          )}
        </ul>
      </div>

      {/* Group assignment */}
      <div className="space-y-2.5 shrink-0">
        <Label className="text-sm font-medium">Assign to group</Label>
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
            Add {selectedInFolderCount > 0 ? `${selectedInFolderCount} ` : ''}to {targetGroupTitle}
          </Button>
        </div>
      </div>

      {/* Pending groups */}
      <div ref={pendingSectionRef} />
      <AnimatePresence>
        {groupsWithPending.length > 0 && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-3 shrink-0 overflow-hidden"
          >
            <div className="space-y-1">
              <Label className="text-sm font-medium">Ready to import</Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {groupsWithPending.length} group
                {groupsWithPending.length === 1 ? '' : 's'} &middot; {totalPendingCount}{' '}
                link{totalPendingCount === 1 ? '' : 's'} staged. Review below, then
                click Import.
              </p>
            </div>
            <div className="space-y-2">
              {groupsWithPending.map((g) => {
                const items = pendingByGroup[g._id] ?? []
                const expanded = pendingGroupExpanded[g._id] ?? true
                return (
                  <m.div
                    key={g._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Collapsible
                      open={expanded}
                      onOpenChange={(next) =>
                        onPendingGroupExpandedChange(g._id, next)
                      }
                      className="overflow-hidden rounded-lg border bg-muted/5"
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
                        >
                          <ChevronDown
                            className={cn(
                              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                              !expanded && '-rotate-90'
                            )}
                          />
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: g.color }}
                          />
                          <span className="min-w-0 truncate">{g.title}</span>
                          <span className="ml-auto text-muted-foreground font-normal tabular-nums text-xs shrink-0">
                            {items.length} link{items.length === 1 ? '' : 's'}
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="space-y-0.5 border-t border-border px-2 py-2 sm:px-3">
                          {items.map((item) => (
                            <li
                              key={`${g._id}-${item.id}`}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors group"
                            >
                              <div
                                className="w-0.5 self-stretch rounded-full shrink-0"
                                style={{ backgroundColor: g.color, opacity: 0.5 }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm line-clamp-1">{item.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.url}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                                aria-label={`Remove ${item.title}`}
                                onClick={() => onRemoveFromPending(g._id, item.id)}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </m.div>
                )
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
})

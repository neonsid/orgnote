'use client'

import { memo, useMemo, useState, type RefObject } from 'react'
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
import { BookMarked, ChevronDown, Library, Sparkles, X } from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  normalizeUrlKey,
  type ParsedImportItem,
} from '@/lib/bookmark-import'
import { chromeFolderSelectLabel } from './parse-export-html'

export type FolderVsTargetSummary =
  | { state: 'loading' }
  | { state: 'idle' }
  | { state: 'ready'; alreadyInGroup: number; notInGroup: number }

export type PendingRowStatus = 'new' | 'in-group' | 'batch-dup'

type GroupRow = { _id: string; title: string; color: string }

type SourceListFilter = 'all' | 'new' | 'in-group'

export interface BookmarkImportStagingPanelProps {
  folderKeys: string[]
  effectiveChromeFolderKey: string
  onChromeFolderChange: (key: string) => void
  availableInFolder: ParsedImportItem[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  /** Select only these ids (e.g. current filter view). */
  onSelectAllInSubset: (ids: string[]) => void
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
  /** `undefined` while Convex loads URL keys for duplicate detection. */
  targetGroupExistingUrlKeys: Set<string> | undefined
  pendingRowStatusByGroup: Record<string, Map<string, PendingRowStatus>>
  folderVsTargetSummary: FolderVsTargetSummary
}

const SOURCE_FILTER_TABS: {
  id: SourceListFilter
  short: string
  icon: typeof Library
  activeClass: string
}[] = [
  {
    id: 'all',
    short: 'All',
    icon: Library,
    activeClass:
      'bg-background text-foreground shadow-sm ring-1 ring-border/80',
  },
  {
    id: 'new',
    short: 'New',
    icon: Sparkles,
    activeClass:
      'bg-emerald-500/12 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/25',
  },
  {
    id: 'in-group',
    short: 'In group',
    icon: BookMarked,
    activeClass:
      'bg-amber-500/12 text-amber-950 dark:text-amber-100 shadow-sm ring-1 ring-amber-500/25',
  },
]

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
  onSelectAllInSubset,
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
  targetGroupExistingUrlKeys,
  pendingRowStatusByGroup,
  folderVsTargetSummary,
}: BookmarkImportStagingPanelProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceListFilter>('all')
  const selectedSet = new Set(selectedIds)

  const sourceCounts = useMemo(() => {
    const all = availableInFolder.length
    if (targetGroupExistingUrlKeys === undefined) {
      return { all, new: 0, inGroup: 0, ready: false as const }
    }
    let newC = 0
    let inG = 0
    for (const item of availableInFolder) {
      if (targetGroupExistingUrlKeys.has(normalizeUrlKey(item.url))) inG++
      else newC++
    }
    return { all, new: newC, inGroup: inG, ready: true as const }
  }, [availableInFolder, targetGroupExistingUrlKeys])

  const effectiveSourceFilter: SourceListFilter =
    targetGroupExistingUrlKeys === undefined ? 'all' : sourceFilter

  const filteredAvailable = useMemo(() => {
    if (targetGroupExistingUrlKeys === undefined) return availableInFolder
    if (effectiveSourceFilter === 'all') return availableInFolder
    return availableInFolder.filter((item) => {
      const inG = targetGroupExistingUrlKeys.has(normalizeUrlKey(item.url))
      return effectiveSourceFilter === 'new' ? !inG : inG
    })
  }, [availableInFolder, effectiveSourceFilter, targetGroupExistingUrlKeys])

  function sourceRowBadge(item: ParsedImportItem) {
    if (targetGroupExistingUrlKeys === undefined) {
      return (
        <span className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          …
        </span>
      )
    }
    const inGroup = targetGroupExistingUrlKeys.has(normalizeUrlKey(item.url))
    if (inGroup) {
      return (
        <span
          className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100"
          title="This URL is already saved in the selected group"
        >
          In group
        </span>
      )
    }
    return (
      <span
        className="shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100"
        title="Not in this group yet (by URL)"
      >
        New
      </span>
    )
  }

  function pendingRowBadge(status: PendingRowStatus | undefined) {
    if (!status) return null
    if (status === 'new') {
      return (
        <span className="shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
          New
        </span>
      )
    }
    if (status === 'in-group') {
      return (
        <span
          className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100"
          title="Already saved in this group"
        >
          In group
        </span>
      )
    }
    return (
      <span
        className="shrink-0 rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-900 dark:text-orange-100"
        title="Same URL appears more than once in this import"
      >
        Repeat
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4">
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

      <div className="flex max-h-[min(52vh,28rem)] sm:max-h-[min(50vh,26rem)] min-h-[10rem] flex-col overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/35 via-background to-background shadow-sm">
        <div className="flex shrink-0 flex-col gap-2 border-b border-border/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2.5 text-xs"
              onClick={() =>
                onSelectAllInSubset(filteredAvailable.map((i) => i.id))
              }
              disabled={filteredAvailable.length === 0}
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
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="tabular-nums">
              <span className="font-medium text-foreground">
                {filteredAvailable.length}
              </span>
              {filteredAvailable.length !== availableInFolder.length ? (
                <>
                  {' '}
                  shown ·{' '}
                  <span className="font-medium text-foreground">
                    {availableInFolder.length}
                  </span>{' '}
                  in folder
                </>
              ) : (
                <> available</>
              )}
            </span>
          </div>
        </div>

        {sourceCounts.ready && availableInFolder.length > 0 && (
          <div
            role="tablist"
            aria-label="Filter links by match with assign target"
            className="mx-3 mt-2 flex rounded-xl bg-muted/50 p-1 ring-1 ring-border/50 sm:mx-4"
          >
            {SOURCE_FILTER_TABS.map((tab) => {
              const count =
                tab.id === 'all'
                  ? sourceCounts.all
                  : tab.id === 'new'
                    ? sourceCounts.new
                    : sourceCounts.inGroup
              const active = sourceFilter === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={!sourceCounts.ready}
                  onClick={() => setSourceFilter(tab.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium transition-all sm:gap-1.5 sm:px-2 sm:text-xs',
                    active
                      ? tab.activeClass
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5 shrink-0 sm:size-4" />
                  <span className="whitespace-nowrap leading-tight">
                    {tab.short}
                  </span>
                  <span className="tabular-nums">({count})</span>
                </button>
              )
            })}
          </div>
        )}

        {folderVsTargetSummary.state === 'loading' &&
          availableInFolder.length > 0 && (
            <p className="border-b border-border/60 px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
              Checking which links are already in &ldquo;{targetGroupTitle}
              &rdquo;…
            </p>
          )}
        {folderVsTargetSummary.state === 'ready' &&
          availableInFolder.length > 0 && (
            <div className="grid grid-cols-2 gap-2 border-b border-border/60 px-3 py-2.5 sm:grid-cols-3 sm:px-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-2 sm:px-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                  New
                </p>
                <p className="text-lg font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                  {folderVsTargetSummary.notInGroup}
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-2 sm:px-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/80">
                  In &ldquo;{targetGroupTitle}&rdquo;
                </p>
                <p className="text-lg font-semibold tabular-nums text-amber-950 dark:text-amber-50">
                  {folderVsTargetSummary.alreadyInGroup}
                </p>
              </div>
              <div className="col-span-2 flex items-center rounded-lg border border-border/70 bg-muted/30 px-2.5 py-2 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-center sm:px-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Total in view
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground sm:mt-0.5">
                  {availableInFolder.length}
                </p>
              </div>
            </div>
          )}

        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3 sm:py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
          {availableInFolder.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              No links left in this folder — change folder or remove some from
              the staged list below.
            </li>
          ) : filteredAvailable.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              {effectiveSourceFilter === 'new'
                ? 'No new links for this group in this folder — try “In group” or “All”.'
                : effectiveSourceFilter === 'in-group'
                  ? 'No duplicates in this folder for this group — try “New” or “All”.'
                  : 'Nothing to show.'}
            </li>
          ) : (
            filteredAvailable.map((item, i) => (
              <m.li
                key={item.id}
                custom={i}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  'cursor-pointer rounded-xl border px-3 py-3 transition-colors sm:px-3.5 sm:py-3',
                  'active:bg-muted/50',
                  targetGroupExistingUrlKeys?.has(normalizeUrlKey(item.url))
                    ? 'border-amber-500/15 bg-amber-500/[0.04] hover:bg-amber-500/[0.07]'
                    : 'border-emerald-500/15 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07]',
                )}
                onClick={() => onToggleRow(item.id)}
              >
                <div className="flex gap-3 sm:items-start">
                  <Checkbox
                    checked={selectedSet.has(item.id)}
                    onCheckedChange={() => onToggleRow(item.id)}
                    className="mt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
                          {item.title}
                        </p>
                        <p
                          className="mt-1 break-all text-xs text-muted-foreground sm:truncate sm:break-normal"
                          title={item.url}
                        >
                          {item.url}
                        </p>
                      </div>
                      <div className="flex shrink-0 sm:items-start sm:pt-0.5">
                        {sourceRowBadge(item)}
                      </div>
                    </div>
                  </div>
                </div>
              </m.li>
            ))
          )}
        </ul>
      </div>

      <div className="space-y-2.5 shrink-0">
        <Label className="text-sm font-medium">Assign to group</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Select
            value={effectiveTargetGroupId}
            onValueChange={onTargetGroupChange}
            disabled={!groups?.length}
          >
            <SelectTrigger className="w-full sm:flex-1 min-h-11">
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
            className="w-full min-h-11 sm:w-auto shrink-0"
            disabled={
              selectedInFolderCount === 0 ||
              !effectiveTargetGroupId ||
              !groups?.length
            }
            onClick={onAddToGroup}
          >
            Add {selectedInFolderCount > 0 ? `${selectedInFolderCount} ` : ''}to{' '}
            <span className="truncate max-w-[40vw] sm:max-w-[12rem] inline-block align-bottom">
              {targetGroupTitle}
            </span>
          </Button>
        </div>
      </div>

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
                {groupsWithPending.length === 1 ? '' : 's'} &middot;{' '}
                {totalPendingCount} link{totalPendingCount === 1 ? '' : 's'}{' '}
                staged. Review below, then click Import.
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
                      className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/30 to-background shadow-sm"
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full flex-col gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/35 sm:flex-row sm:items-center sm:gap-2 sm:px-4"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <ChevronDown
                              className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                !expanded && '-rotate-90',
                              )}
                            />
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: g.color }}
                            />
                            <span className="min-w-0 truncate text-sm font-medium">
                              {g.title}
                            </span>
                          </div>
                          <span className="pl-6 text-xs font-normal tabular-nums text-muted-foreground sm:ml-auto sm:pl-0 sm:text-right">
                            {(() => {
                              const sm = pendingRowStatusByGroup[g._id]
                              if (!sm) {
                                return `${items.length} link${items.length === 1 ? '' : 's'}`
                              }
                              let nNew = 0
                              let nIn = 0
                              let nRep = 0
                              for (const it of items) {
                                const st = sm.get(it.id)
                                if (st === 'new') nNew++
                                else if (st === 'in-group') nIn++
                                else if (st === 'batch-dup') nRep++
                              }
                              const parts: string[] = []
                              if (nNew > 0) parts.push(`${nNew} new`)
                              if (nIn > 0) parts.push(`${nIn} in group`)
                              if (nRep > 0) parts.push(`${nRep} repeat`)
                              const detail =
                                parts.length > 0 ? ` · ${parts.join(', ')}` : ''
                              return `${items.length} link${items.length === 1 ? '' : 's'}${detail}`
                            })()}
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="space-y-2 border-t border-border/60 px-2 py-2 sm:px-3 sm:py-3">
                          {items.map((item) => (
                            <li
                              key={`${g._id}-${item.id}`}
                              className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/35 sm:flex-row sm:items-center sm:gap-2 sm:py-2"
                            >
                              <div
                                className="hidden w-0.5 shrink-0 self-stretch rounded-full sm:block"
                                style={{
                                  backgroundColor: g.color,
                                  opacity: 0.55,
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {pendingRowBadge(
                                    pendingRowStatusByGroup[g._id]?.get(
                                      item.id,
                                    ),
                                  )}
                                </div>
                                <p className="mt-1 text-sm font-medium leading-snug line-clamp-2">
                                  {item.title}
                                </p>
                                <p
                                  className="mt-0.5 break-all text-xs text-muted-foreground sm:truncate sm:break-normal"
                                  title={item.url}
                                >
                                  {item.url}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0 self-end text-muted-foreground hover:text-foreground sm:self-center sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                                aria-label={`Remove ${item.title}`}
                                onClick={() =>
                                  onRemoveFromPending(g._id, item.id)
                                }
                              >
                                <X className="size-4" />
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

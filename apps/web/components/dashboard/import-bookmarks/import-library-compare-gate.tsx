'use client'

import { memo, useMemo, useState } from 'react'
import { BookMarked, FileUp, Library, Sparkles } from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  normalizeUrlKey,
  type ParsedImportItem,
} from '@/lib/bookmark-import'

type GroupRow = { _id: string; title: string; color: string }

type CompareRow = {
  urlKey: string
  displayUrl: string
  primaryTitle: string
  inFileCount: number
  matchingGroups: GroupRow[]
  isNew: boolean
}

type CompareFilter = 'all' | 'new' | 'existing'

function buildCompareRows(
  items: ParsedImportItem[],
  groups: GroupRow[] | undefined,
  existingKeysByGroupId: Map<string, Set<string>>,
): CompareRow[] {
  const byKey = new Map<
    string,
    { displayUrl: string; titles: string[]; count: number }
  >()
  for (const item of items) {
    const k = normalizeUrlKey(item.url)
    const cur = byKey.get(k)
    if (cur) {
      cur.count += 1
      if (!cur.titles.includes(item.title)) cur.titles.push(item.title)
    } else {
      byKey.set(k, {
        displayUrl: item.url,
        titles: [item.title],
        count: 1,
      })
    }
  }

  const order: string[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const k = normalizeUrlKey(item.url)
    if (seen.has(k)) continue
    seen.add(k)
    order.push(k)
  }

  const gList = groups ?? []
  const rows: CompareRow[] = []
  for (const urlKey of order) {
    const v = byKey.get(urlKey)
    if (!v) continue
    const matchingGroups = gList.filter((g) =>
      existingKeysByGroupId.get(g._id)?.has(urlKey),
    )
    rows.push({
      urlKey,
      displayUrl: v.displayUrl,
      primaryTitle: v.titles[0] ?? '',
      inFileCount: v.count,
      matchingGroups,
      isNew: matchingGroups.length === 0,
    })
  }
  return rows
}

function filterRows(rows: CompareRow[], filter: CompareFilter): CompareRow[] {
  if (filter === 'all') return rows
  if (filter === 'new') return rows.filter((r) => r.isNew)
  return rows.filter((r) => !r.isNew)
}

const FILTER_TABS: {
  id: CompareFilter
  label: string
  short: string
  icon: typeof Sparkles
  activeClass: string
}[] = [
  {
    id: 'all',
    label: 'All links',
    short: 'All',
    icon: Library,
    activeClass:
      'bg-background text-foreground shadow-sm ring-1 ring-border/80',
  },
  {
    id: 'new',
    label: 'New — not in any group',
    short: 'New',
    icon: Sparkles,
    activeClass:
      'bg-emerald-500/12 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/25',
  },
  {
    id: 'existing',
    label: 'In library — already saved',
    short: 'Saved',
    icon: BookMarked,
    activeClass:
      'bg-amber-500/12 text-amber-950 dark:text-amber-100 shadow-sm ring-1 ring-amber-500/25',
  },
]

export interface ImportLibraryCompareGateProps {
  fileLabel: string
  parsedItems: ParsedImportItem[]
  groups: GroupRow[] | undefined
  existingKeysByGroupId: Map<string, Set<string>>
  /** Convex `getBookmarkUrlKeysForImport` resolved. */
  importUrlKeysLoaded: boolean
  onContinue: () => void
  onPickDifferentFile: () => void
}

export const ImportLibraryCompareGate = memo(function ImportLibraryCompareGate({
  fileLabel,
  parsedItems,
  groups,
  existingKeysByGroupId,
  importUrlKeysLoaded,
  onContinue,
  onPickDifferentFile,
}: ImportLibraryCompareGateProps) {
  const [filter, setFilter] = useState<CompareFilter>('new')

  const rows = useMemo(
    () => buildCompareRows(parsedItems, groups, existingKeysByGroupId),
    [parsedItems, groups, existingKeysByGroupId],
  )

  const stats = useMemo(() => {
    const unique = rows.length
    const newCount = rows.filter((r) => r.isNew).length
    const existingCount = unique - newCount
    return { unique, newCount, existingCount }
  }, [rows])

  const visibleRows = useMemo(() => filterRows(rows, filter), [rows, filter])

  const canContinue = importUrlKeysLoaded && groups !== undefined

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col min-h-0"
    >
      <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 shrink-0">
        <FileUp className="size-4 text-muted-foreground shrink-0" />
        <p
          className="text-sm text-muted-foreground truncate min-w-0"
          title={fileLabel}
        >
          <span className="font-medium text-foreground">{fileLabel}</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs shrink-0"
          onClick={onPickDifferentFile}
        >
          Change file
        </Button>
      </div>

      <div className="mx-4 sm:mx-6 mb-4 flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 via-background to-background shadow-sm">
        <div className="shrink-0 space-y-4 border-b border-border/60 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Compare to your library
              </h2>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground leading-relaxed">
                URLs are matched across all groups (hash ignored). Use the
                tabs below to focus on{' '}
                <span className="font-medium text-foreground">new</span> links
                or what you{' '}
                <span className="font-medium text-foreground">already have</span>
                — no need to scan the full list.
              </p>
            </div>
          </div>

          {!importUrlKeysLoaded ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-flex size-2 animate-pulse rounded-full bg-primary/60" />
              Loading your saved bookmarks…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-left sm:px-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Unique in file
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {stats.unique}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-3 text-left sm:px-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                    New
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                    {stats.newCount}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-3 text-left sm:px-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/80">
                    Saved
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-950 dark:text-amber-50">
                    {stats.existingCount}
                  </p>
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Filter by library match"
                className="flex gap-0.5 rounded-xl bg-muted/50 p-1 ring-1 ring-border/50 sm:gap-0"
              >
                {FILTER_TABS.map((tab) => {
                  const count =
                    tab.id === 'all'
                      ? stats.unique
                      : tab.id === 'new'
                        ? stats.newCount
                        : stats.existingCount
                  const Icon = tab.icon
                  const active = filter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      title={tab.label}
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-2 text-[10px] font-medium transition-all sm:flex-row sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-xs md:text-sm',
                        active ? tab.activeClass : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="size-3.5 shrink-0 sm:size-4" />
                      <span className="flex min-w-0 max-w-full flex-col items-center gap-0 leading-tight sm:flex-row sm:gap-1">
                        <span className="max-w-full text-center sm:whitespace-nowrap">
                          {tab.short}
                        </span>
                        <span
                          className={cn(
                            'tabular-nums sm:whitespace-nowrap',
                            active ? 'opacity-100' : 'opacity-80',
                          )}
                        >
                          ({count})
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="px-0.5 text-[10px] leading-snug text-muted-foreground sm:px-0 sm:text-[11px] sm:leading-relaxed">
                Matches use at most the first 100 bookmarks per group; very
                large groups may miss some duplicates.
              </p>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
          {!importUrlKeysLoaded ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              …
            </div>
          ) : visibleRows.length === 0 ? (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center"
            >
              <p className="text-sm font-medium text-foreground">
                {filter === 'new'
                  ? 'Everything in this file is already in your library'
                  : filter === 'existing'
                    ? 'Nothing from this file matched your saved URLs'
                    : 'Nothing to show'}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
                {filter === 'new'
                  ? 'Switch to “Saved” to see where those links live, or continue to assign folders anyway.'
                  : filter === 'existing'
                    ? 'All links look new — try the “New” tab.'
                    : 'Try another filter above.'}
              </p>
            </m.div>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleRows.map((row) => (
                  <m.li
                    key={row.urlKey}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5',
                      row.isNew
                        ? 'border-emerald-500/15 bg-emerald-500/[0.04]'
                        : 'border-amber-500/15 bg-amber-500/[0.04]',
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              row.isNew
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                                : 'bg-amber-500/15 text-amber-950 dark:text-amber-100',
                            )}
                          >
                            {row.isNew ? 'New' : 'Saved'}
                          </span>
                          {row.inFileCount > 1 && (
                            <span className="text-[10px] font-medium text-muted-foreground">
                              ×{row.inFileCount} in file
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-medium leading-snug text-foreground line-clamp-2">
                          {row.primaryTitle}
                        </p>
                        <p
                          className="mt-0.5 break-all text-xs text-muted-foreground sm:truncate sm:break-normal"
                          title={row.displayUrl}
                        >
                          {row.displayUrl}
                        </p>
                      </div>
                      {!row.isNew && (
                        <div className="flex flex-wrap gap-1.5 sm:max-w-[13rem] sm:justify-end">
                          {row.matchingGroups.map((g) => (
                            <span
                              key={g._id}
                              className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/90 px-2 py-1 text-[10px] font-medium text-foreground shadow-sm"
                              title={g.title}
                            >
                              <span
                                className="size-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: g.color }}
                              />
                              <span className="max-w-[9rem] truncate">
                                {g.title}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {importUrlKeysLoaded && visibleRows.length > 0
                ? `Showing ${visibleRows.length} of ${stats.unique} unique links`
                : importUrlKeysLoaded
                  ? 'Pick a tab to preview a subset'
                  : ''}
            </p>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!canContinue}
              onClick={onContinue}
            >
              Continue to assign groups
            </Button>
          </div>
        </div>
      </div>
    </m.div>
  )
})

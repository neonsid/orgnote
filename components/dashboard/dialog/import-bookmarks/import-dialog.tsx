'use client'

import { memo, useCallback, useMemo, useReducer, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CloudUpload } from 'lucide-react'
import { toast } from '@/lib/toast'
import {
  UNCATEGORIZED_CHROME_FOLDER,
  buildExistingKeysByGroupId,
  buildNewOnlyPendingByGroup,
  hasImportDuplicateConflict,
  itemsInChromeFolder,
  partitionPendingImport,
  totalPartitionSkips,
  type ParsedImportItem,
  type StagedImportPartition,
} from '@/lib/bookmark-import'
import { DuplicateUrlsAlertDialog } from './duplicate-urls-alert'
import {
  INITIAL_IMPORT_DIALOG_STATE,
  importDialogReducer,
} from './dialog-state'
import { NO_BOOKMARKS, parseBookmarkFile } from './parse-export-html'
import { BookmarkImportStagingPanel } from './staging-panel'

const MAX_IMPORT_BATCH = 100

interface ImportBookmarksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ImportBookmarksDialog = memo(function ImportBookmarksDialog({
  open,
  onOpenChange,
}: ImportBookmarksDialogProps) {
  const groups = useQuery(api.groups.queries.list)
  const dashboardData = useQuery(
    api.bookmarks.queries.getDashboardData,
    open ? {} : 'skip'
  )
  const importBookmarks = useMutation(api.bookmarks.mutations.importBookmarks)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, dispatch] = useReducer(
    importDialogReducer,
    INITIAL_IMPORT_DIALOG_STATE
  )
  const stateRef = useRef(state)
  // Latest import state for async import completion (avoids stale closure over parsedItems).
  // eslint-disable-next-line react-hooks/refs -- sync for runImport after await boundaries
  stateRef.current = state

  const {
    parsedItems,
    chromeFolderKeys,
    loadedFileLabel,
    chromeFolderKey,
    selectedIds,
    targetGroupId,
    pendingByGroup,
    isImporting,
    duplicateAlertOpen,
    pendingGroupExpanded,
  } = state

  // Map<groupId, Set<url-key>> built from current library data for duplicate detection.
  const existingKeysByGroupId = useMemo(() => {
    if (!dashboardData?.bookmarks) return new Map<string, Set<string>>()
    return buildExistingKeysByGroupId(dashboardData.bookmarks)
  }, [dashboardData])

  // Only computed when the duplicate alert is open — partitions each group's
  // pending items into new / db-duplicate / batch-duplicate buckets.
  const duplicatePartitions = useMemo((): Record<
    string,
    StagedImportPartition
  > => {
    if (!duplicateAlertOpen) return {}
    return partitionPendingImport(pendingByGroup, existingKeysByGroupId)
  }, [duplicateAlertOpen, pendingByGroup, existingKeysByGroupId])

  // Set of item IDs already assigned to any pending group (used to hide them from the folder list).
  const assignedIds = useMemo(() => {
    const s = new Set<string>()
    for (const items of Object.values(pendingByGroup)) {
      for (const i of items) s.add(i.id)
    }
    return s
  }, [pendingByGroup])

  // Resolve the active Chrome folder key, falling back to the first available.
  const effectiveChromeFolderKey = useMemo(() => {
    if (chromeFolderKeys.length === 0) return chromeFolderKey
    if (chromeFolderKeys.includes(chromeFolderKey)) return chromeFolderKey
    return chromeFolderKeys[0] ?? UNCATEGORIZED_CHROME_FOLDER
  }, [chromeFolderKeys, chromeFolderKey])

  // Items in the active Chrome folder that haven't been assigned to a group yet.
  const availableInFolder = useMemo(() => {
    if (!parsedItems?.length) return []
    const inFolder = itemsInChromeFolder(parsedItems, effectiveChromeFolderKey)
    return inFolder.filter((i) => !assignedIds.has(i.id))
  }, [parsedItems, effectiveChromeFolderKey, assignedIds])

  // Resolve the target group ID, falling back to the first group.
  const effectiveTargetGroupId = useMemo(() => {
    if (!groups?.length) return ''
    if (targetGroupId && groups.some((g) => g._id === targetGroupId)) {
      return targetGroupId
    }
    return groups[0]!._id
  }, [groups, targetGroupId])

  // Groups that have at least one pending item staged for import.
  const groupsWithPending = useMemo(() => {
    if (!groups) return []
    return groups.filter((g) => (pendingByGroup[g._id]?.length ?? 0) > 0)
  }, [groups, pendingByGroup])

  const newOnlyImportCount = Object.values(duplicatePartitions).reduce(
    (acc, p) => acc + p.newItems.length,
    0
  )

  const totalPendingCount = Object.values(pendingByGroup).reduce(
    (acc, arr) => acc + arr.length,
    0
  )

  const targetGroupTitle =
    groups?.find((g) => g._id === effectiveTargetGroupId)?.title ?? 'group'

  const selectedInFolderCount = availableInFolder.filter((i) =>
    selectedIds.includes(i.id)
  ).length

  const importButtonLabel = isImporting
    ? 'Importing…'
    : totalPendingCount > 0 && dashboardData === undefined
      ? 'Loading bookmarks…'
      : `Import selected (${totalPendingCount})`

  /** Reset reducer state and clear the file input. */
  const resetAll = useCallback(() => {
    dispatch({ type: 'reset' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  /** Wraps onOpenChange to also reset state when the dialog closes. */
  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetAll()
      onOpenChange(next)
    },
    [onOpenChange, resetAll]
  )

  /** Parse a selected HTML file and dispatch the result into state. */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    toast.promise(parseBookmarkFile(file), {
      loading: 'Parsing bookmarks…',
      success: (data) => {
        dispatch({
          type: 'fileParsed',
          parsed: data.parsed,
          chromeFolderKeys: data.chromeFolderKeys,
          fileName: data.fileName,
        })
        const long =
          data.skippedTooLongCount > 0
            ? ` · ${data.skippedTooLongCount} link${data.skippedTooLongCount === 1 ? '' : 's'} skipped (URL too long)`
            : ''
        return `Loaded ${data.parsed.length} links from "${data.fileName}"${long}`
      },
      error: (err) => {
        if (err instanceof Error && err.message === NO_BOOKMARKS) {
          return 'No bookmarks found in that file.'
        }
        if (err instanceof Error && err.message.startsWith('FILE_TOO_LARGE:')) {
          const mb = err.message.split(':')[1] ?? '5'
          return `That file is too large (max ${mb} MB).`
        }
        return 'Could not read that file'
      },
    })
    e.target.value = ''
  }

  // --- Stable callbacks for memoized children ---

  const handleChromeFolderChange = useCallback((key: string) => {
    dispatch({ type: 'setChromeFolder', key })
  }, [])

  const handleToggleRow = useCallback((id: string) => {
    dispatch({ type: 'toggleSelectedId', id })
  }, [])

  const handleSelectAll = useCallback(() => {
    dispatch({
      type: 'selectAllInFolder',
      ids: availableInFolder.map((i) => i.id),
    })
  }, [availableInFolder])

  const handleSelectNone = useCallback(() => {
    dispatch({ type: 'selectNone' })
  }, [])

  const handleTargetGroupChange = useCallback((groupId: string) => {
    dispatch({ type: 'setTargetGroup', groupId })
  }, [])

  const handlePendingGroupExpandedChange = useCallback(
    (groupId: string, expanded: boolean) => {
      dispatch({ type: 'setPendingGroupExpanded', groupId, expanded })
    },
    []
  )

  const handleRemoveFromPending = useCallback(
    (groupId: string, itemId: string) => {
      dispatch({ type: 'removeFromPending', groupId, itemId })
    },
    []
  )

  /** Move selected items from the folder list into the target group's pending queue. */
  const handleAddToGroup = useCallback(() => {
    if (!effectiveTargetGroupId) {
      toast.error('Choose a group')
      return
    }
    const toAdd = availableInFolder.filter((i) => selectedIds.includes(i.id))
    if (toAdd.length === 0) {
      toast.error('Select at least one link')
      return
    }
    dispatch({
      type: 'addToGroup',
      groupId: effectiveTargetGroupId,
      items: toAdd,
    })
    toast.success(
      `Added ${toAdd.length} link${toAdd.length === 1 ? '' : 's'} to group`
    )
  }, [effectiveTargetGroupId, availableInFolder, selectedIds])

  /**
   * Send pending bookmarks to the backend in batches, then clean up imported
   * items from local state. Handles both "import all" and "new-only" modes.
   */
  const runImport = useCallback(
    async (
      payload: Record<string, ParsedImportItem[]>,
      toastMode: 'full' | 'newOnly',
      partitionsForNewOnlyToast?: Record<string, StagedImportPartition>
    ) => {
      const entries = Object.entries(payload).filter(
        ([, items]) => items.length > 0
      )
      if (entries.length === 0) {
        toast.error('Nothing to import')
        return
      }

      dispatch({ type: 'setImporting', importing: true })
      dispatch({ type: 'setDuplicateAlertOpen', open: false })
      try {
        let importedTotal = 0
        let skippedTotal = 0
        const snapshot: Record<string, ParsedImportItem[]> = {}
        for (const [gid, items] of entries) {
          snapshot[gid] = [...items]
        }

        for (const [groupId, items] of entries) {
          for (let i = 0; i < items.length; i += MAX_IMPORT_BATCH) {
            const chunk = items.slice(i, i + MAX_IMPORT_BATCH)
            const result = await importBookmarks({
              groupId: groupId as Id<'groups'>,
              items: chunk.map((item) => ({
                title: item.title,
                url: item.url,
              })),
            })
            importedTotal += result.importedCount
            skippedTotal += result.skippedCount
          }
        }

        const importedUrls = new Set(
          Object.values(snapshot)
            .flat()
            .map((i) => i.url)
        )

        const currentParsed = stateRef.current.parsedItems ?? []
        const filtered = currentParsed.filter((i) => !importedUrls.has(i.url))
        const finalParsed = filtered.length > 0 ? filtered : null
        const label = finalParsed?.length
          ? stateRef.current.loadedFileLabel
          : ''

        dispatch({
          type: 'applyAfterImport',
          parsedItems: finalParsed,
          loadedFileLabel: label,
        })

        if (toastMode === 'newOnly' && partitionsForNewOnlyToast) {
          const { db, batch } = totalPartitionSkips(partitionsForNewOnlyToast)
          const skipped = db + batch
          const detail: string[] = []
          if (db > 0) detail.push(`${db} already in group`)
          if (batch > 0) detail.push(`${batch} listed twice in this import`)
          toast.success(
            `Imported ${importedTotal} bookmark${importedTotal === 1 ? '' : 's'}` +
              (skipped > 0
                ? ` · Skipped ${skipped} duplicate URL${skipped === 1 ? '' : 's'}` +
                  (detail.length > 0 ? ` (${detail.join(', ')})` : '')
                : '')
          )
        } else {
          toast.success(
            `Imported ${importedTotal} bookmark${importedTotal === 1 ? '' : 's'}` +
              (skippedTotal > 0 ? ` (${skippedTotal} skipped)` : '')
          )
        }

        handleDialogOpenChange(false)
      } catch {
        toast.error('Import failed')
        dispatch({ type: 'setImporting', importing: false })
      }
    },
    [importBookmarks, handleDialogOpenChange]
  )

  /** Validate pending state and kick off the import (or open the duplicate alert). */
  const handleImportClick = useCallback(() => {
    const entries = Object.entries(pendingByGroup).filter(
      ([, items]) => items.length > 0
    )
    if (entries.length === 0) {
      toast.error('Add links to at least one of your groups first')
      return
    }
    if (dashboardData === undefined) {
      toast.error('Loading your bookmarks… try again in a moment')
      return
    }
    if (hasImportDuplicateConflict(pendingByGroup, existingKeysByGroupId)) {
      dispatch({ type: 'setDuplicateAlertOpen', open: true })
      return
    }
    void runImport(pendingByGroup, 'full')
  }, [pendingByGroup, dashboardData, existingKeysByGroupId, runImport])

  /** Import everything including duplicates (from the duplicate alert). */
  const handleImportAllDuplicates = useCallback(() => {
    void runImport(pendingByGroup, 'full')
  }, [pendingByGroup, runImport])

  /** Import only new-to-group items, skipping duplicates (from the duplicate alert). */
  const handleImportNewOnlyDuplicates = useCallback(() => {
    const newOnly = buildNewOnlyPendingByGroup(
      pendingByGroup,
      existingKeysByGroupId
    )
    const entries = Object.entries(newOnly).filter(
      ([, items]) => items.length > 0
    )
    if (entries.length === 0) {
      toast.error('Nothing new to import')
      return
    }
    const partitions = partitionPendingImport(
      pendingByGroup,
      existingKeysByGroupId
    )
    void runImport(newOnly, 'newOnly', partitions)
  }, [pendingByGroup, existingKeysByGroupId, runImport])

  const handleDuplicateAlertOpenChange = useCallback((open: boolean) => {
    dispatch({ type: 'setDuplicateAlertOpen', open })
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl flex max-h-[85vh] sm:max-h-[90vh] min-h-0 flex-col gap-0 overflow-hidden p-0">
          <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 pb-3 sm:pb-4 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Import Bookmarks
              </DialogTitle>
              {loadedFileLabel ? (
                <DialogDescription
                  className="truncate text-left"
                  title={loadedFileLabel}
                >
                  Source:{' '}
                  <span className="font-medium text-foreground">
                    {loadedFileLabel}
                  </span>
                </DialogDescription>
              ) : (
                <DialogDescription>
                  Add your bookmarks HTML file (
                  <code className="text-xs">.html</code>
                  ).
                </DialogDescription>
              )}
            </DialogHeader>

            <input
              id="bookmark-file-input"
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,text/html,application/xhtml+xml"
              className="sr-only"
              onChange={handleFileChange}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload className="h-4 w-4 mr-2" />
                Add file
              </Button>
            </div>
          </div>

          {parsedItems && parsedItems.length > 0 && (
            <BookmarkImportStagingPanel
              folderKeys={chromeFolderKeys}
              effectiveChromeFolderKey={effectiveChromeFolderKey}
              onChromeFolderChange={handleChromeFolderChange}
              availableInFolder={availableInFolder}
              selectedIds={selectedIds}
              onToggleRow={handleToggleRow}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
              groups={groups}
              effectiveTargetGroupId={effectiveTargetGroupId}
              onTargetGroupChange={handleTargetGroupChange}
              targetGroupTitle={targetGroupTitle}
              onAddToGroup={handleAddToGroup}
              selectedInFolderCount={selectedInFolderCount}
              groupsWithPending={groupsWithPending}
              pendingByGroup={pendingByGroup}
              pendingGroupExpanded={pendingGroupExpanded}
              onPendingGroupExpandedChange={handlePendingGroupExpandedChange}
              onRemoveFromPending={handleRemoveFromPending}
              totalPendingCount={totalPendingCount}
            />
          )}

          <div className="flex flex-col-reverse gap-2 p-4 sm:p-6 pt-3 sm:pt-4 shrink-0 border-t border-border sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleImportClick}
              disabled={
                isImporting ||
                totalPendingCount === 0 ||
                !parsedItems?.length ||
                (totalPendingCount > 0 && dashboardData === undefined)
              }
            >
              {importButtonLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DuplicateUrlsAlertDialog
        open={duplicateAlertOpen}
        onOpenChange={handleDuplicateAlertOpenChange}
        duplicatePartitions={duplicatePartitions}
        groups={groups}
        isImporting={isImporting}
        totalPendingCount={totalPendingCount}
        newOnlyImportCount={newOnlyImportCount}
        onImportAllDuplicates={handleImportAllDuplicates}
        onImportNewOnlyDuplicates={handleImportNewOnlyDuplicates}
      />
    </>
  )
})

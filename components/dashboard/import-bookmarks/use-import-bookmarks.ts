'use client'

import { useCallback, useMemo, useReducer, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
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
import { useDashboardStore } from '@/stores/dashboard-store'
import {
  INITIAL_IMPORT_VIEW_STATE,
  importViewReducer,
} from './import-state'
import { NO_BOOKMARKS, parseBookmarkFile } from './parse-export-html'

const MAX_IMPORT_BATCH = 100

export function useImportBookmarks() {
  const router = useRouter()
  const groups = useQuery(api.groups.queries.list)
  const dashboardData = useQuery(api.bookmarks.queries.getDashboardData, {})
  const importBookmarksMutation = useMutation(api.bookmarks.mutations.importBookmarks)
  const setSelectedGroupId = useDashboardStore((s) => s.setSelectedGroupId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const duplicateReviewRef = useRef<HTMLDivElement>(null)
  const pendingSectionRef = useRef<HTMLDivElement>(null)

  const [state, dispatch] = useReducer(
    importViewReducer,
    INITIAL_IMPORT_VIEW_STATE
  )
  const stateRef = useRef(state)
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
    duplicateReviewVisible,
    pendingGroupExpanded,
  } = state

  const existingKeysByGroupId = useMemo(() => {
    if (!dashboardData?.bookmarks) return new Map<string, Set<string>>()
    return buildExistingKeysByGroupId(dashboardData.bookmarks)
  }, [dashboardData])

  const duplicatePartitions = useMemo((): Record<
    string,
    StagedImportPartition
  > => {
    if (!duplicateReviewVisible) return {}
    return partitionPendingImport(pendingByGroup, existingKeysByGroupId)
  }, [duplicateReviewVisible, pendingByGroup, existingKeysByGroupId])

  const assignedIds = useMemo(() => {
    const s = new Set<string>()
    for (const items of Object.values(pendingByGroup)) {
      for (const i of items) s.add(i.id)
    }
    return s
  }, [pendingByGroup])

  const effectiveChromeFolderKey = useMemo(() => {
    if (chromeFolderKeys.length === 0) return chromeFolderKey
    if (chromeFolderKeys.includes(chromeFolderKey)) return chromeFolderKey
    return chromeFolderKeys[0] ?? UNCATEGORIZED_CHROME_FOLDER
  }, [chromeFolderKeys, chromeFolderKey])

  const availableInFolder = useMemo(() => {
    if (!parsedItems?.length) return []
    const inFolder = itemsInChromeFolder(parsedItems, effectiveChromeFolderKey)
    return inFolder.filter((i) => !assignedIds.has(i.id))
  }, [parsedItems, effectiveChromeFolderKey, assignedIds])

  const effectiveTargetGroupId = useMemo(() => {
    if (!groups?.length) return ''
    if (targetGroupId && groups.some((g) => g._id === targetGroupId)) {
      return targetGroupId
    }
    return groups[0]!._id
  }, [groups, targetGroupId])

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

  const hasFile = parsedItems && parsedItems.length > 0

  const resetAll = useCallback(() => {
    dispatch({ type: 'reset' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  function scrollToRef(ref: React.RefObject<HTMLElement | null>) {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const syntheticEvent = {
      target: { files: e.dataTransfer.files, value: '' },
    } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileChange(syntheticEvent)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

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
    scrollToRef(pendingSectionRef)
  }, [effectiveTargetGroupId, availableInFolder, selectedIds])

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
      dispatch({ type: 'setDuplicateReviewVisible', visible: false })
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
            const result = await importBookmarksMutation({
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

        const firstImportedGroupId = entries[0]?.[0] as Id<'groups'> | undefined
        if (firstImportedGroupId) {
          setSelectedGroupId(firstImportedGroupId)
        }

        resetAll()
        router.push('/dashboard')
      } catch {
        toast.error('Import failed')
        dispatch({ type: 'setImporting', importing: false })
      }
    },
    [importBookmarksMutation, setSelectedGroupId, resetAll, router]
  )

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
      dispatch({ type: 'setDuplicateReviewVisible', visible: true })
      scrollToRef(duplicateReviewRef)
      return
    }
    void runImport(pendingByGroup, 'full')
  }, [pendingByGroup, dashboardData, existingKeysByGroupId, runImport])

  const handleImportAllDuplicates = useCallback(() => {
    void runImport(pendingByGroup, 'full')
  }, [pendingByGroup, runImport])

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

  const handleDuplicateReviewCancel = useCallback(() => {
    dispatch({ type: 'setDuplicateReviewVisible', visible: false })
  }, [])

  return {
    // refs
    fileInputRef,
    duplicateReviewRef,
    pendingSectionRef,
    // data
    groups,
    parsedItems,
    chromeFolderKeys,
    loadedFileLabel,
    effectiveChromeFolderKey,
    availableInFolder,
    selectedIds,
    effectiveTargetGroupId,
    targetGroupTitle,
    selectedInFolderCount,
    groupsWithPending,
    pendingByGroup,
    pendingGroupExpanded,
    totalPendingCount,
    duplicatePartitions,
    duplicateReviewVisible,
    isImporting,
    newOnlyImportCount,
    importButtonLabel,
    hasFile,
    dashboardData,
    // handlers
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleChromeFolderChange,
    handleToggleRow,
    handleSelectAll,
    handleSelectNone,
    handleTargetGroupChange,
    handlePendingGroupExpandedChange,
    handleRemoveFromPending,
    handleAddToGroup,
    handleImportClick,
    handleImportAllDuplicates,
    handleImportNewOnlyDuplicates,
    handleDuplicateReviewCancel,
  }
}

'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { Loader2 } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUser } from '@clerk/react'
import { DashboardHeader } from './dashboard-header'
import { BookmarkList, type Bookmark } from './bookmark-list'
import { FilterDropdown, type FilterType } from './filter-dropdown'
import { BookmarkSearch } from './bookmark-search'
import { m } from 'motion/react'
import dynamic from 'next/dynamic'
import { type Id } from '@/convex/_generated/dataModel'
import { extractDomain } from '@/lib/domain-utils'
import { extractTwitterHandleFromUrl } from '@/convex/lib/url_classifier'
import { useDialogStore } from '@/stores/dialog-store'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { UnsafeBookmarkToastBridge } from '@/hooks/use-unsafe-bookmark-toast'
import { toast } from '@/lib/toast'
import {
  toExportedBookmark,
  downloadBookmarksFile,
} from '@/lib/bookmark-export'

const EditBookmarkDialog = dynamic(
  () =>
    import('./dialog/edit-bookmark-dialog').then((m) => m.EditBookmarkDialog),
  { ssr: false }
)

const DeleteBookmarkDialog = dynamic(
  () =>
    import('@/components/dialogs').then((m) => m.DeleteBookmarkDialog),
  { ssr: false }
)

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { groups, bookmarks, effectiveGroupId, selectGroup, isLoading } =
    useDashboardData(!!user)

  const bookmarkSafetyWatch = useMemo(
    () =>
      bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        publicListingBlockedForUrlSafety: b.publicListingBlockedForUrlSafety,
      })),
    [bookmarks],
  )

  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<
    Set<Id<'bookmarks'>>
  >(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<Id<'bookmarks'>[]>([])

  useMountEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const {
    editBookmark,
    deleteBookmarkOrItem,
    openEditBookmarkDialog,
    closeEditBookmarkDialog,
    openDeleteBookmarkDialog,
    closeDeleteBookmarkDialog,
  } = useDialogStore()

  const createBookmark = useMutation(api.bookmarks.mutations.createBookMark)
  const deleteBookmark = useMutation(api.bookmarks.mutations.deleteBookMark)
  const deleteBookmarksBulk = useMutation(
    api.bookmarks.mutations.deleteBookmarksBulk
  )
  const moveBookmark = useMutation(api.bookmarks.mutations.moveBookMark)
  const moveBookmarksBulk = useMutation(
    api.bookmarks.mutations.moveBookmarksBulk
  )
  const toggleReadStatus = useMutation(api.bookmarks.mutations.toggleReadStatus)
  const createGroup = useMutation(api.groups.mutations.create)

  const handleSubmitBookmark = useCallback(
    async (value: string) => {
      if (!effectiveGroupId) {
        toast.info('Please create a group first to add bookmarks', {
          description:
            'Click on the group selector in the header to create a new group',
        })
        return
      }

      const domain = extractDomain(value)
      const isUrl = domain.includes('.')

      const url = isUrl
        ? value.startsWith('http')
          ? value
          : `https://${value}`
        : '#'

      const twHandle = isUrl ? extractTwitterHandleFromUrl(url) : null
      const title = isUrl
        ? twHandle
          ? `Tweet by @${twHandle}`
          : domain.split('.')[0].charAt(0).toUpperCase() +
            domain.split('.')[0].slice(1)
        : value

      const currentGroupId = effectiveGroupId
      if (!currentGroupId) return

      await createBookmark({
        title,
        url,
        groupId: currentGroupId as Id<'groups'>,
        imageUrl: isUrl
          ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
          : '',
      })
      setDebouncedQuery('')
    },
    [createBookmark, effectiveGroupId]
  )

  const filteredBookmarks = bookmarks.filter((b) => {
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      const matchesSearch =
        b.title.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    if (filter === 'read') return b.doneReading
    if (filter === 'unread') return !b.doneReading
    return true
  })

  const handleCopy = useCallback((bookmark: Bookmark) => {
    navigator.clipboard.writeText(bookmark.url)
    toast.success('URL copied to clipboard')
  }, [])

  const handleEdit = useCallback(
    (bookmark: Bookmark) => {
      openEditBookmarkDialog(bookmark.id, {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
      })
    },
    [openEditBookmarkDialog]
  )

  const handleMove = useCallback(
    (bookmarkId: Id<'bookmarks'>, newGroupId: Id<'groups'>) => {
      moveBookmark({ bookmarkId: bookmarkId, groupId: newGroupId })
    },
    [moveBookmark]
  )

  const handleDelete = useCallback(
    (bookmark: Bookmark) => {
      openDeleteBookmarkDialog(bookmark.id as Id<'bookmarks'>, bookmark.title)
    },
    [openDeleteBookmarkDialog]
  )

  const handleToggleRead = useCallback(
    (bookmarkId: Id<'bookmarks'>) => {
      toggleReadStatus({ bookmarkId })
    },
    [toggleReadStatus]
  )

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false)
    setSelectedBookmarkIds(new Set())
  }, [])

  const enterMultiSelect = useCallback((id: Id<'bookmarks'>) => {
    setMultiSelectMode(true)
    setSelectedBookmarkIds(new Set([id]))
  }, [])

  const toggleMultiSelect = useCallback((id: Id<'bookmarks'>) => {
    setSelectedBookmarkIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allVisibleBookmarksSelected = useMemo(
    () =>
      filteredBookmarks.length > 0 &&
      filteredBookmarks.every((b) => selectedBookmarkIds.has(b.id)),
    [filteredBookmarks, selectedBookmarkIds],
  )

  const selectAllVisibleBookmarks = useCallback(() => {
    setSelectedBookmarkIds((prev) => {
      const visibleIds = filteredBookmarks.map((b) => b.id)
      if (visibleIds.length === 0) return prev

      const everyVisibleInSelection = visibleIds.every((id) => prev.has(id))
      if (everyVisibleInSelection) {
        return new Set()
      }
      return new Set(visibleIds)
    })
  }, [filteredBookmarks])

  const handleMoveSelectedBookmarks = useCallback(
    async (newGroupId: Id<'groups'>) => {
      const ids = [...selectedBookmarkIds]
      if (ids.length === 0) return
      const n = ids.length
      try {
        await moveBookmarksBulk({ bookmarkIds: ids, groupId: newGroupId })
        toast.success(
          `Moved ${n} bookmark${n === 1 ? '' : 's'}`,
        )
        exitMultiSelect()
      } catch {
        toast.error('Failed to move bookmarks')
      }
    },
    [selectedBookmarkIds, moveBookmarksBulk, exitMultiSelect]
  )

  const handleCopySelectedUrls = useCallback(() => {
    if (selectedBookmarkIds.size === 0) {
      toast.error('Select at least one bookmark')
      return
    }
    const urls = filteredBookmarks
      .filter((b) => selectedBookmarkIds.has(b.id))
      .map((b) => b.url)
    void navigator.clipboard.writeText(urls.join('\n'))
    toast.success(
      urls.length === 1 ? 'URL copied to clipboard' : 'URLs copied to clipboard'
    )
  }, [filteredBookmarks, selectedBookmarkIds])

  const handleExportSelectedBookmarks = useCallback(
    (format: 'json' | 'csv') => {
      const selected = filteredBookmarks.filter((b) =>
        selectedBookmarkIds.has(b.id)
      )
      if (selected.length === 0) {
        toast.error('Select at least one bookmark')
        return
      }
      const exported = selected.map((b) => {
        const g = groups.find((g) => g._id === b.groupId)
        return toExportedBookmark({
          title: b.title,
          url: b.url,
          groupName: g?.title ?? 'Unknown',
          createdAtIso: new Date(`${b.createdAt}T00:00:00.000Z`).toISOString(),
        })
      })
      downloadBookmarksFile({
        format,
        bookmarks: exported,
        filenamePrefix: 'OrgNote',
      })
      toast.success(
        `Exported ${exported.length} bookmark${exported.length === 1 ? '' : 's'}`
      )
    },
    [filteredBookmarks, selectedBookmarkIds, groups]
  )

  const handleDeleteSelectedBookmarks = useCallback(() => {
    if (selectedBookmarkIds.size === 0) {
      toast.error('Select at least one bookmark')
      return
    }
    setBulkDeleteIds([...selectedBookmarkIds])
    setBulkDeleteOpen(true)
  }, [selectedBookmarkIds])

  const handleBulkDeleteOpenChange = useCallback((open: boolean) => {
    setBulkDeleteOpen(open)
    if (!open) setBulkDeleteIds([])
  }, [])

  const runBulkDelete = useCallback(async () => {
    if (bulkDeleteIds.length === 0) return
    const n = bulkDeleteIds.length
    try {
      await deleteBookmarksBulk({ bookmarkIds: bulkDeleteIds })
      toast.success(
        `Deleted ${n} bookmark${n === 1 ? '' : 's'}`,
      )
      exitMultiSelect()
    } catch {
      toast.error('Failed to delete bookmarks')
    }
  }, [bulkDeleteIds, deleteBookmarksBulk, exitMultiSelect])

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <UnsafeBookmarkToastBridge
        key={effectiveGroupId || '__none__'}
        bookmarks={bookmarkSafetyWatch}
      />
      <DashboardHeader
        variant="dashboard"
        showPublicButton={true}
        createGroup={createGroup}
        groups={groups}
        effectiveGroupId={effectiveGroupId}
        onSelectGroup={selectGroup}
        loading={isLoading}
      />

      <main
        className={`flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-2 sm:mt-10 ${multiSelectMode ? 'pb-28' : ''}`}
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1">
            <BookmarkSearch
              ref={searchInputRef}
              onSearch={setDebouncedQuery}
              onSubmit={handleSubmitBookmark}
            />
          </div>
          <FilterDropdown value={filter} onChange={setFilter} />
        </div>

        <div className="flex items-center justify-between px-3 mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Title
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Created At
          </span>
        </div>

        <m.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="origin-left mb-2 px-2"
        >
          <div className="h-px bg-foreground/20 dark:bg-white/80" />
        </m.div>

        <BookmarkList
          loading={isLoading}
          groups={groups}
          bookmarks={filteredBookmarks}
          effectiveGroupId={effectiveGroupId as Id<'groups'>}
          multiSelectMode={multiSelectMode}
          selectedBookmarkIds={selectedBookmarkIds}
          allVisibleBookmarksSelected={allVisibleBookmarksSelected}
          onToggleMultiSelect={toggleMultiSelect}
          onEnterMultiSelect={enterMultiSelect}
          onExitMultiSelect={exitMultiSelect}
          onSelectAllVisibleBookmarks={selectAllVisibleBookmarks}
          onMoveSelectedBookmarks={handleMoveSelectedBookmarks}
          onCopySelectedUrls={handleCopySelectedUrls}
          onExportSelectedBookmarks={handleExportSelectedBookmarks}
          onDeleteSelectedBookmarks={handleDeleteSelectedBookmarks}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onToggleRead={handleToggleRead}
        />
      </main>

      <EditBookmarkDialog
        key={editBookmark.bookmarkData?.id ?? 'closed'}
        bookmark={editBookmark.bookmarkData}
        open={editBookmark.open}
        onOpenChange={closeEditBookmarkDialog}
      />

      <DeleteBookmarkDialog
        bookmarkOrFileId={deleteBookmarkOrItem.bookmarkOrFileId}
        title={deleteBookmarkOrItem.title}
        variant="Bookmark"
        open={deleteBookmarkOrItem.open}
        onOpenChange={closeDeleteBookmarkDialog}
        onDelete={async () => {
          if (!deleteBookmarkOrItem.bookmarkOrFileId) return
          await deleteBookmark({
            bookmarkId:
              deleteBookmarkOrItem.bookmarkOrFileId as Id<'bookmarks'>,
          })
        }}
      />

      <DeleteBookmarkDialog
        bookmarkOrFileId={null}
        title={null}
        variant="Bookmark"
        open={bulkDeleteOpen}
        onOpenChange={handleBulkDeleteOpenChange}
        bulkBookmarkCount={bulkDeleteIds.length}
        onDelete={runBulkDelete}
      />
    </div>
  )
}

'use client'

import { useCallback, useRef, useMemo, useReducer } from 'react'
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
  () => import('@/components/dialogs').then((m) => m.DeleteBookmarkDialog),
  { ssr: false }
)

type DashboardUiState = {
  debouncedQuery: string
  filter: FilterType
  multiSelectMode: boolean
  selectedBookmarkIds: Set<Id<'bookmarks'>>
  bulkDeleteOpen: boolean
  bulkDeleteIds: Id<'bookmarks'>[]
}

type DashboardUiAction =
  | { type: 'setDebouncedQuery'; query: string }
  | { type: 'setFilter'; filter: FilterType }
  | { type: 'exitMultiSelect' }
  | { type: 'enterMultiSelect'; id: Id<'bookmarks'> }
  | { type: 'toggleMultiSelect'; id: Id<'bookmarks'> }
  | { type: 'selectAllVisibleBookmarks'; visibleIds: Id<'bookmarks'>[] }
  | { type: 'openBulkDelete'; ids: Id<'bookmarks'>[] }
  | { type: 'bulkDeleteOpenChange'; open: boolean }

const initialDashboardUi: DashboardUiState = {
  debouncedQuery: '',
  filter: 'all',
  multiSelectMode: false,
  selectedBookmarkIds: new Set(),
  bulkDeleteOpen: false,
  bulkDeleteIds: [],
}

function dashboardReducer(
  state: DashboardUiState,
  action: DashboardUiAction
): DashboardUiState {
  switch (action.type) {
    case 'setDebouncedQuery':
      return { ...state, debouncedQuery: action.query }
    case 'setFilter':
      return { ...state, filter: action.filter }
    case 'exitMultiSelect':
      return {
        ...state,
        multiSelectMode: false,
        selectedBookmarkIds: new Set(),
      }
    case 'enterMultiSelect':
      return {
        ...state,
        multiSelectMode: true,
        selectedBookmarkIds: new Set([action.id]),
      }
    case 'toggleMultiSelect': {
      const next = new Set(state.selectedBookmarkIds)
      if (next.has(action.id)) next.delete(action.id)
      else next.add(action.id)
      return { ...state, selectedBookmarkIds: next }
    }
    case 'selectAllVisibleBookmarks': {
      const { visibleIds } = action
      if (visibleIds.length === 0) return state
      const prev = state.selectedBookmarkIds
      const everyVisible = visibleIds.every((id) => prev.has(id))
      return {
        ...state,
        selectedBookmarkIds: everyVisible
          ? new Set()
          : new Set(visibleIds),
      }
    }
    case 'openBulkDelete':
      return {
        ...state,
        bulkDeleteOpen: true,
        bulkDeleteIds: action.ids,
      }
    case 'bulkDeleteOpenChange':
      if (!action.open) {
        return { ...state, bulkDeleteOpen: false, bulkDeleteIds: [] }
      }
      return { ...state, bulkDeleteOpen: true }
    default:
      return state
  }
}

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    groups,
    bookmarks,
    effectiveGroupId,
    selectGroup,
    isLoading,
    bookmarkPaginationStatus,
    loadMoreBookmarks,
  } = useDashboardData(!!user)

  const bookmarkSafetyWatch = useMemo(
    () =>
      bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        publicListingBlockedForUrlSafety: b.publicListingBlockedForUrlSafety,
      })),
    [bookmarks]
  )

  const [ui, dispatchUi] = useReducer(dashboardReducer, initialDashboardUi)
  const {
    debouncedQuery,
    filter,
    multiSelectMode,
    selectedBookmarkIds,
    bulkDeleteOpen,
    bulkDeleteIds,
  } = ui

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
      dispatchUi({ type: 'setDebouncedQuery', query: '' })
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
    dispatchUi({ type: 'exitMultiSelect' })
  }, [])

  const enterMultiSelect = useCallback((id: Id<'bookmarks'>) => {
    dispatchUi({ type: 'enterMultiSelect', id })
  }, [])

  const toggleMultiSelect = useCallback((id: Id<'bookmarks'>) => {
    dispatchUi({ type: 'toggleMultiSelect', id })
  }, [])

  const allVisibleBookmarksSelected = useMemo(
    () =>
      filteredBookmarks.length > 0 &&
      filteredBookmarks.every((b) => selectedBookmarkIds.has(b.id)),
    [filteredBookmarks, selectedBookmarkIds]
  )

  const selectAllVisibleBookmarks = useCallback(() => {
    dispatchUi({
      type: 'selectAllVisibleBookmarks',
      visibleIds: filteredBookmarks.map((b) => b.id),
    })
  }, [filteredBookmarks])

  const handleMoveSelectedBookmarks = useCallback(
    async (newGroupId: Id<'groups'>) => {
      const ids = [...selectedBookmarkIds]
      if (ids.length === 0) return
      const n = ids.length
      try {
        await moveBookmarksBulk({ bookmarkIds: ids, groupId: newGroupId })
        toast.success(`Moved ${n} bookmark${n === 1 ? '' : 's'}`)
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
    const urls: string[] = []
    for (const b of filteredBookmarks) {
      if (!selectedBookmarkIds.has(b.id)) continue
      urls.push(b.url)
    }
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
    dispatchUi({
      type: 'openBulkDelete',
      ids: [...selectedBookmarkIds],
    })
  }, [selectedBookmarkIds])

  const handleBulkDeleteOpenChange = useCallback((open: boolean) => {
    dispatchUi({ type: 'bulkDeleteOpenChange', open })
  }, [])

  const runBulkDelete = useCallback(async () => {
    if (bulkDeleteIds.length === 0) return
    const n = bulkDeleteIds.length
    try {
      await deleteBookmarksBulk({ bookmarkIds: bulkDeleteIds })
      toast.success(`Deleted ${n} bookmark${n === 1 ? '' : 's'}`)
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
              onSearch={(query) =>
                dispatchUi({ type: 'setDebouncedQuery', query })
              }
              onSubmit={handleSubmitBookmark}
            />
          </div>
          <FilterDropdown
            value={filter}
            onChange={(next) =>
              dispatchUi({ type: 'setFilter', filter: next })
            }
          />
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
          bookmarkPaginationStatus={bookmarkPaginationStatus}
          onLoadMoreBookmarks={loadMoreBookmarks}
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

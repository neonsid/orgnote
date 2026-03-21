'use client'

import { useState, useCallback, useRef } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { Loader2 } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUser } from '@clerk/react'
import { DashboardHeader } from './dashboard-header'
import { BookmarkList, type Bookmark } from './bookmark-list'
import { FilterDropdown, type FilterType } from './filter-dropdown'
import { BookmarkSearch } from './bookmark-search'
import { motion } from 'motion/react'
import dynamic from 'next/dynamic'
import { type Id } from '@/convex/_generated/dataModel'
import { extractDomain } from '@/lib/domain-utils'
import { useDialogStore } from '@/stores/dialog-store'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { toast } from 'sonner'

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

  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

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
  const moveBookmark = useMutation(api.bookmarks.mutations.moveBookMark)
  const toggleReadStatus = useMutation(api.bookmarks.mutations.toggleReadStatus)
  const createGroup = useMutation(api.groups.mutations.create)

  const handleSubmitBookmark = useCallback(
    async (value: string) => {
      if (!effectiveGroupId) {
        toast('Please create a group first to add bookmarks', {
          description:
            'Click on the group selector in the header to create a new group',
        })
        return
      }

      const domain = extractDomain(value)
      const isUrl = domain.includes('.')

      const title = isUrl
        ? domain.split('.')[0].charAt(0).toUpperCase() +
          domain.split('.')[0].slice(1)
        : value

      const url = isUrl
        ? value.startsWith('http')
          ? value
          : `https://${value}`
        : '#'

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
      <DashboardHeader
        variant="dashboard"
        showPublicButton={true}
        createGroup={createGroup}
        groups={groups}
        effectiveGroupId={effectiveGroupId}
        onSelectGroup={selectGroup}
        loading={isLoading}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-2 sm:mt-10">
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

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="origin-left mb-2 px-2"
        >
          <div className="h-px bg-foreground/20 dark:bg-white/80" />
        </motion.div>

        <BookmarkList
          loading={isLoading}
          groups={groups}
          bookmarks={filteredBookmarks}
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
    </div>
  )
}

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Fish, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { authClient } from '@/lib/auth-client'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { GroupSelector } from '@/components/dashboard/group-selector'
import { BookmarkSearch } from '@/components/dashboard/bookmark-search'
import { BookmarkList } from '@/components/dashboard/bookmark-list'
import { UserInfo } from '@/components/dashboard/user-info'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type Doc, type Id } from '@/convex/_generated/dataModel'

type Bookmark = {
  id: Id<'bookmarks'>
  title: string
  domain: string
  url: string
  favicon: string | null
  fallbackColor: string
  createdAt: string
  groupId: string
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

function extractDomain(input: string): string {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`)
    return url.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

export default function DashboardPage() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession()

  const userId = session?.user?.id ?? ''

  // Fetch groups from Convex (skip query while session is loading)
  const groups = useQuery(api.groups.list, userId ? { userId } : 'skip')

  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [search, setSearch] = useState('')

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(
    null
  )
  const [newTitle, setNewTitle] = useState('')

  // Auto-select the first group when groups load
  const effectiveGroupId = useMemo(() => {
    if (selectedGroupId && groups?.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId
    }
    return groups?.[0]?._id ?? ''
  }, [selectedGroupId, groups])

  // Fetch bookmarks from Convex (skip query while no group selected)
  const convexBookmarks = useQuery(
    api.bookmarks.listBookMarks,
    effectiveGroupId ? { groupId: effectiveGroupId as Id<'groups'> } : 'skip'
  )

  const loadingBookMarks = convexBookmarks === undefined

  const createBookmark = useMutation(api.bookmarks.createBookMark)
  const deleteBookmark = useMutation(api.bookmarks.deleteBookMark)
  const renameBookmark = useMutation(api.bookmarks.renameBookMark)
  const moveBookmark = useMutation(api.bookmarks.moveBookMark)

  const handleSubmit = useCallback(
    async (value: string) => {
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

      if (!effectiveGroupId) return

      await createBookmark({
        title,
        url,
        groupId: effectiveGroupId as Id<'groups'>,
        imageUrl: isUrl
          ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
          : '',
      })
      setSearch('')
    },
    [effectiveGroupId, createBookmark]
  )

  const allBookmarks = useMemo(() => {
    if (!convexBookmarks) return []
    return convexBookmarks.map((b: Doc<'bookmarks'>) => ({
      id: b._id,
      title: b.title,
      domain: extractDomain(b.url),
      url: b.url,
      favicon: b.imageUrl || null,
      fallbackColor: COLORS[b.title.charCodeAt(0) % COLORS.length],
      createdAt: new Date(b.createdAt).toISOString().split('T')[0],
      groupId: b.groupId,
    }))
  }, [convexBookmarks])

  const filteredBookmarks: Bookmark[] = useMemo(() => {
    if (!search.trim()) return allBookmarks
    const q = search.toLowerCase()
    return allBookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q)
    )
  }, [allBookmarks, search])

  // Context menu handlers
  const handleCopy = useCallback((bookmark: Bookmark) => {
    navigator.clipboard.writeText(bookmark.url)
  }, [])

  const handleRename = useCallback((bookmark: Bookmark) => {
    setSelectedBookmark(bookmark)
    setNewTitle(bookmark.title)
    setRenameDialogOpen(true)
  }, [])

  const handleMove = useCallback(
    (bookmarkId: Id<'bookmarks'>, newGroupId: Id<'groups'>) => {
      moveBookmark({ bookmarkId: bookmarkId, groupId: newGroupId })
    },
    []
  )

  const handleDelete = useCallback((bookmark: Bookmark) => {
    setSelectedBookmark(bookmark)
    setDeleteDialogOpen(true)
  }, [])

  const handleRenameConfirm = useCallback(async () => {
    if (!selectedBookmark || !newTitle.trim()) return
    await renameBookmark({
      bookmarkId: selectedBookmark.id as Id<'bookmarks'>,
      title: newTitle.trim(),
    })
    setRenameDialogOpen(false)
    setSelectedBookmark(null)
    setNewTitle('')
  }, [selectedBookmark, newTitle, renameBookmark])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedBookmark) return
    await deleteBookmark({
      bookmarkId: selectedBookmark.id as Id<'bookmarks'>,
    })
    setDeleteDialogOpen(false)
    setSelectedBookmark(null)
  }, [selectedBookmark, deleteBookmark])

  // Loading state while session or groups are being fetched
  if (isSessionLoading || groups === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Please sign in to view your dashboard.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dashboard header */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center">
                <Fish
                  className="size-5 text-blue-600 dark:text-blue-400"
                  strokeWidth={1.5}
                />
              </div>
            </Link>
            <span className="text-muted-foreground select-none">/</span>
            <GroupSelector
              groups={groups}
              selectedGroupId={effectiveGroupId}
              onSelect={setSelectedGroupId}
              userId={userId}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
              <AnimatedThemeToggler aria-label="Toggle theme" />
            </div>
            <UserInfo user={session.user} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-10">
        <div className="mb-4 sm:mb-6">
          <BookmarkSearch
            value={search}
            onChange={setSearch}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="rounded-xl overflow-hidden">
          <BookmarkList
            loading={loadingBookMarks}
            groups={groups}
            bookmarks={filteredBookmarks}
            onCopy={handleCopy}
            onRename={handleRename}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </div>
      </main>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Bookmark</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Bookmark title"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Bookmark</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{selectedBookmark?.title}
              &quot;? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

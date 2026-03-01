'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import Image from 'next/image'
import GitHub from 'lucide-react/dist/esm/icons/github'
import Twitter from 'lucide-react/dist/esm/icons/twitter'
import Globe from 'lucide-react/dist/esm/icons/globe'
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right'
import { extractDomain } from '@/lib/domain-utils'
import { PublicProfileHeader } from '@/components/public-profile-header'

// Animation variants matching dashboard
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

interface PublicProfileContentProps {
  username: string
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

export default function PublicProfileContent({
  username,
}: PublicProfileContentProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // Fetch the public profile
  const profile = useQuery(api.profile.getProfileByUsername, { username })

  // Fetch the user's public groups
  const groups = useQuery(api.groups.getPublicGroupsByUsername, { username })

  // Fetch bookmarks from public groups
  const bookmarks = useQuery(api.bookmarks.getPublicBookmarksByUsername, {
    username,
  })

  // Filter bookmarks by selected group
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return []
    if (!selectedGroupId) return bookmarks
    return bookmarks.filter((b) => b.groupId === selectedGroupId)
  }, [bookmarks, selectedGroupId])

  if (
    profile === undefined ||
    groups === undefined ||
    bookmarks === undefined
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Profile not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The user @{username} does not exist.
          </p>
        </div>
      </div>
    )
  }

  const initial = username.charAt(0).toUpperCase()

  // Get social links
  const githubLink = profile.links?.find(
    (link: { label: string; url: string }) => link.label === 'GitHub'
  )
  const twitterLink = profile.links?.find(
    (link: { label: string; url: string }) => link.label === 'Twitter'
  )
  const portfolioLink = profile.links?.find(
    (link: { label: string; url: string }) => link.label === 'Portfolio'
  )

  return (
    <div className="min-h-screen bg-background">
      <PublicProfileHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Left Sidebar */}
          <aside className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center justify-center size-20 rounded-full bg-muted text-foreground text-2xl font-bold select-none">
                {initial}
              </div>
            </div>

            {/* Name and Username */}
            <div className="text-center md:text-left">
              <h1 className="text-xl font-semibold text-foreground">
                {profile.name || profile.username}
              </h1>
              <p className="text-muted-foreground">@{username}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground text-center md:text-left">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              {githubLink && (
                <a
                  href={githubLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GitHub className="size-5" />
                </a>
              )}
              {twitterLink && (
                <a
                  href={
                    twitterLink.url.startsWith('http')
                      ? twitterLink.url
                      : `https://twitter.com/${twitterLink.url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="size-5" />
                </a>
              )}
              {portfolioLink && (
                <a
                  href={portfolioLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="size-5" />
                </a>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Group Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedGroupId(null)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedGroupId === null
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                All
              </button>
              {groups?.map((group) => (
                <button
                  key={group._id}
                  onClick={() => setSelectedGroupId(group._id as string)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedGroupId === group._id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.title}
                </button>
              ))}
            </div>

            {/* Bookmark List Header */}
            <div className="flex items-center justify-between border-b border-border py-2">
              <span className="text-sm font-medium text-muted-foreground">
                Title
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Updated
              </span>
            </div>

            {/* Bookmark List */}
            <div className="space-y-2 -mt-2">
              {filteredBookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  transition={{
                    duration: 0.25,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 group hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {bookmark.imageUrl ? (
                        <Image
                          src={bookmark.imageUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="size-5 rounded shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="size-5 rounded flex items-center justify-center text-xs text-white font-medium shrink-0"
                          style={{ backgroundColor: bookmark.groupColor }}
                        >
                          {bookmark.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                        <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {bookmark.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                          {extractDomain(bookmark.url)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground tabular-nums transition-transform duration-200 group-hover:-translate-x-1">
                        {formatDate(bookmark.createdAt)}
                      </span>
                      <ArrowUpRight className="hidden size-4 text-muted-foreground group-hover:inline transition-all ease-in duration-400" />
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Empty state if no bookmarks */}
            {filteredBookmarks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {groups?.length === 0
                    ? 'No public groups available'
                    : selectedGroupId
                      ? 'No bookmarks in this group'
                      : 'No bookmarks in public groups'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

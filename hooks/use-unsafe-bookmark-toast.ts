'use client'

import { useRef } from 'react'
import { toast } from '@/lib/toast'

export type BookmarkSafetyWatch = {
  id: string
  title: string
  publicListingBlockedForUrlSafety?: boolean
}

/**
 * When Convex updates a bookmark after Google Safe Browsing (async), show one
 * warning toast per bookmark when it transitions to blocked — not on initial
 * load of already-blocked rows or after switching groups.
 *
 * Renders nothing. Parent should set `key` to the active group id so a group
 * switch remounts and re-seeds baseline (same as the old hook’s groupKey reset).
 *
 * Uses refs during render for transition detection and queueMicrotask for
 * toasts (imperative UI must not run during render; we avoid useEffect per
 * .agents frontend guidance).
 */
export function UnsafeBookmarkToastBridge({
  bookmarks,
}: {
  bookmarks: BookmarkSafetyWatch[]
}) {
  const prevBlockedById = useRef<Map<string, boolean | undefined>>(new Map())
  const seeded = useRef(false)

  /* Transition detection uses refs during render to avoid useEffect (.agents/use-effect skill). */
  /* eslint-disable react-hooks/refs -- render-phase map sync; toasts deferred via queueMicrotask */
  if (!seeded.current) {
    for (const b of bookmarks) {
      prevBlockedById.current.set(b.id, b.publicListingBlockedForUrlSafety)
    }
    seeded.current = true
  } else {
    const seen = new Set<string>()
    const toNotify: BookmarkSafetyWatch[] = []
    for (const b of bookmarks) {
      seen.add(b.id)
      const prev = prevBlockedById.current.get(b.id)
      const nowBlocked = b.publicListingBlockedForUrlSafety === true
      if (nowBlocked && prev !== true) {
        toNotify.push(b)
      }
      prevBlockedById.current.set(b.id, b.publicListingBlockedForUrlSafety)
    }
    for (const id of [...prevBlockedById.current.keys()]) {
      if (!seen.has(id)) prevBlockedById.current.delete(id)
    }
    if (toNotify.length > 0) {
      // Strict Mode: second render sees updated map; same transition is not queued twice.
      queueMicrotask(() => {
        for (const b of toNotify) {
          toast.warning('Unsafe URL detected', {
            description: `"${b.title}" matched Google Safe Browsing. Consider deleting it if you don't trust this link.`,
          })
        }
      })
    }
  }
  /* eslint-enable react-hooks/refs */

  return null
}

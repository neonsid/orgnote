import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { mutation, type MutationCtx } from '../_generated/server'
import { Id } from '../_generated/dataModel'
import { requireAuth } from '../lib/auth'
import {
  faviconUrlForHttpUrl,
  isValidUrl,
  verifyBookmarkOwnership,
  verifyGroupOwnership,
} from './helpers'
import {
  classifyUrl,
  isFigmaUrl,
  isLikelyNonHtmlUrl,
  parseGitHubRepo,
} from '../lib/url_classifier'
import { internal } from '../_generated/api'
import {
  MAX_BULK_BOOKMARK_DELETE,
  MAX_BULK_BOOKMARK_IMPORT,
  MAX_BULK_BOOKMARK_MOVE,
} from '../lib/constants'

async function scheduleUrlSafetyCheck(
  ctx: MutationCtx,
  bookmarkId: Id<'bookmarks'>
): Promise<void> {
  await ctx.scheduler.runAfter(
    0,
    internal.safeBrowsing.checkBookmarkUrlInternal,
    {
      bookmarkId,
    }
  )
}

async function scheduleBookmarkMetadata(
  ctx: MutationCtx,
  bookmarkId: Id<'bookmarks'>,
  url: string,
  userId: string,
  hasDescription: boolean
): Promise<void> {
  if (hasDescription || isFigmaUrl(url) || isLikelyNonHtmlUrl(url)) return
  const urlType = classifyUrl(url)
  if (urlType === 'github') {
    const repoInfo = parseGitHubRepo(url)
    if (repoInfo) {
      await ctx.scheduler.runAfter(
        0,
        internal.metadata.updateBookmarkGitHubMetadata,
        {
          bookmarkId,
          owner: repoInfo.owner,
          repo: repoInfo.repo,
        }
      )
    }
    return
  }
  await ctx.scheduler.runAfter(
    0,
    internal.bookmarks.internal.generateAndUpdateMetadata,
    {
      bookmarkId,
      url,
      userId,
    }
  )
}

export const createBookMark = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    groupId: v.id('groups'),
    imageUrl: v.string(),
    doneReading: v.optional(v.boolean()),
  },
  returns: v.id('bookmarks'),
  handler: async (ctx, args): Promise<Id<'bookmarks'>> => {
    const userId = await requireAuth(ctx)

    if (!args.groupId) {
      throw new ConvexError({
        code: 'INVALID_ARGS',
        message: 'GroupId not found',
      })
    }

    if (!isValidUrl(args.url)) {
      throw new ConvexError({
        code: 'INVALID_ARGS',
        message: 'Invalid URL format',
      })
    }

    await verifyGroupOwnership(ctx, args.groupId, userId)

    const bookmarkId = await ctx.db.insert('bookmarks', {
      title: args.title,
      description: args.description || '',
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: false,
    })

    await scheduleBookmarkMetadata(
      ctx,
      bookmarkId,
      args.url,
      userId,
      Boolean(args.description)
    )
    await scheduleUrlSafetyCheck(ctx, bookmarkId)

    return bookmarkId
  },
})

export const deleteBookMark = mutation({
  args: { bookmarkId: v.id('bookmarks') },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId)

    await ctx.db.delete(args.bookmarkId)
    return { success: true }
  },
})

export const importBookmarks = mutation({
  args: {
    groupId: v.id('groups'),
    items: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
      })
    ),
  },
  returns: v.object({
    importedCount: v.number(),
    skippedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    await verifyGroupOwnership(ctx, args.groupId, userId)

    if (args.items.length === 0) {
      return { importedCount: 0, skippedCount: 0 }
    }

    if (args.items.length > MAX_BULK_BOOKMARK_IMPORT) {
      throw new ConvexError({
        code: 'INVALID_ARGS',
        message: `You can import at most ${MAX_BULK_BOOKMARK_IMPORT} bookmarks at once`,
      })
    }

    let importedCount = 0
    let skippedCount = 0

    for (const item of args.items) {
      const url = item.url.trim()
      const title = item.title.trim() || 'Untitled'

      if (!isValidUrl(url)) {
        skippedCount++
        continue
      }

      const imageUrl = faviconUrlForHttpUrl(url)

      const bookmarkId = await ctx.db.insert('bookmarks', {
        title,
        description: '',
        groupId: args.groupId,
        url,
        imageUrl,
        doneReading: false,
      })

      await scheduleBookmarkMetadata(ctx, bookmarkId, url, userId, false)
      await scheduleUrlSafetyCheck(ctx, bookmarkId)
      importedCount++
    }

    return { importedCount, skippedCount }
  },
})

export const deleteBookmarksBulk = mutation({
  args: { bookmarkIds: v.array(v.id('bookmarks')) },
  returns: v.object({ deletedCount: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (args.bookmarkIds.length === 0) {
      return { deletedCount: 0 }
    }

    if (args.bookmarkIds.length > MAX_BULK_BOOKMARK_DELETE) {
      throw new ConvexError({
        code: 'INVALID_ARGS',
        message: `You can delete at most ${MAX_BULK_BOOKMARK_DELETE} bookmarks at once`,
      })
    }

    const uniqueIds = [...new Set(args.bookmarkIds)]
    for (const bookmarkId of uniqueIds) {
      await verifyBookmarkOwnership(ctx, bookmarkId, userId)
      await ctx.db.delete(bookmarkId)
    }

    return { deletedCount: uniqueIds.length }
  },
})

export const renameBookMark = mutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    title: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId)

    await ctx.db.patch(args.bookmarkId, {
      title: args.title,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

export const markAsDone = mutation({
  args: { bookmarkId: v.id('bookmarks') },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId)

    await ctx.db.patch(args.bookmarkId, {
      doneReading: true,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

export const toggleReadStatus = mutation({
  args: { bookmarkId: v.id('bookmarks') },
  returns: v.object({ success: v.boolean(), doneReading: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Bookmark not found',
      })
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId)

    const newDoneReading = !bookmark.doneReading
    await ctx.db.patch(args.bookmarkId, {
      doneReading: newDoneReading,
      updatedAt: Date.now(),
    })
    return { success: true, doneReading: newDoneReading }
  },
})

export const moveBookMark = mutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    groupId: v.id('groups'),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await Promise.all([
      verifyBookmarkOwnership(ctx, args.bookmarkId, userId),
      verifyGroupOwnership(ctx, args.groupId, userId),
    ])

    await ctx.db.patch(args.bookmarkId, {
      groupId: args.groupId,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

export const moveBookmarksBulk = mutation({
  args: {
    bookmarkIds: v.array(v.id('bookmarks')),
    groupId: v.id('groups'),
  },
  returns: v.object({ movedCount: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (args.bookmarkIds.length === 0) {
      return { movedCount: 0 }
    }

    if (args.bookmarkIds.length > MAX_BULK_BOOKMARK_MOVE) {
      throw new ConvexError({
        code: 'INVALID_ARGS',
        message: `You can move at most ${MAX_BULK_BOOKMARK_MOVE} bookmarks at once`,
      })
    }

    await verifyGroupOwnership(ctx, args.groupId, userId)

    const uniqueIds = [...new Set(args.bookmarkIds)]
    const updatedAt = Date.now()
    for (const bookmarkId of uniqueIds) {
      await verifyBookmarkOwnership(ctx, bookmarkId, userId)
      await ctx.db.patch(bookmarkId, {
        groupId: args.groupId,
        updatedAt,
      })
    }

    return { movedCount: uniqueIds.length }
  },
})

export const updateBookmarkDetails = mutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId)

    const updateData: {
      title?: string
      url?: string
      description?: string
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.title !== undefined) {
      updateData.title = args.title
    }

    if (args.url !== undefined) {
      if (!isValidUrl(args.url)) {
        throw new ConvexError({
          code: 'INVALID_ARGS',
          message: 'Invalid URL format',
        })
      }
      updateData.url = args.url
    }

    if (args.description !== undefined) {
      updateData.description = args.description
    }

    const urlChanged = args.url !== undefined

    await ctx.db.patch(args.bookmarkId, {
      ...updateData,
      ...(urlChanged
        ? {
            publicListingBlockedForUrlSafety: undefined,
            urlSafetyCheckedAt: undefined,
          }
        : {}),
    })

    if (urlChanged) {
      await scheduleUrlSafetyCheck(ctx, args.bookmarkId)
    }

    return { success: true }
  },
})

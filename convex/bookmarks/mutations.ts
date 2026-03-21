import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { mutation } from '../_generated/server'
import { Id } from '../_generated/dataModel'
import { requireAuth } from '../lib/auth'
import {
  isValidUrl,
  verifyBookmarkOwnership,
  verifyGroupOwnership,
} from './helpers'
import { classifyUrl, parseGitHubRepo } from '../lib/url_classifier'
import { internal } from '../_generated/api'

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

    const urlType = classifyUrl(args.url)

    const bookmarkId = await ctx.db.insert('bookmarks', {
      title: args.title,
      description: args.description || '',
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: false,
    })

    if (urlType === 'github' && !args.description) {
      const repoInfo = parseGitHubRepo(args.url)
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
    }

    if (!args.description && urlType !== 'github') {
      await ctx.scheduler.runAfter(
        0,
        internal.bookmarks.internal.generateAndUpdateMetadata,
        {
          bookmarkId,
          url: args.url,
          userId,
        }
      )
    }

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

    await ctx.db.patch(args.bookmarkId, updateData)

    return { success: true }
  },
})

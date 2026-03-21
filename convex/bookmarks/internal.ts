import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../_generated/server'
import { Id } from '../_generated/dataModel'
import { internal } from '../_generated/api'
import { api } from '../_generated/api'
// ──────────────────────────────────────────────
// Internal
// ──────────────────────────────────────────────

export const insertBookmarkInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    groupId: v.id('groups'),
    imageUrl: v.string(),
    doneReading: v.boolean(),
  },
  returns: v.id('bookmarks'),
  handler: async (ctx, args): Promise<Id<'bookmarks'>> => {
    return await ctx.db.insert('bookmarks', {
      title: args.title,
      description: args.description,
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: args.doneReading,
    })
  },
})

export const updateBookmarkInternal = internalMutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: {
      title?: string
      description?: string
      imageUrl?: string
    } = {}

    if (args.title !== undefined) updateData.title = args.title
    if (args.description !== undefined)
      updateData.description = args.description
    if (args.imageUrl !== undefined) updateData.imageUrl = args.imageUrl

    await ctx.db.patch(args.bookmarkId, updateData)
  },
})

export const getGroupForInsert = internalQuery({
  args: { groupId: v.id('groups') },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      title: v.string(),
      color: v.string(),
      userId: v.string(),
      isPublic: v.optional(v.boolean()),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId)
    if (!group) return null
    return group
  },
})

export const generateAndUpdateMetadata = internalAction({
  args: {
    bookmarkId: v.id('bookmarks'),
    url: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const metadataResult = await ctx.runAction(
        api.metadata.generateBookmarkDescription,
        { url: args.url, userId: args.userId }
      )

      if (metadataResult.success) {
        const updateData: {
          title?: string
          description?: string
          imageUrl?: string
        } = {}

        if (metadataResult.title) {
          updateData.title = metadataResult.title
        }
        if (metadataResult.description) {
          updateData.description = metadataResult.description
        }
        if (metadataResult.imageUrl) {
          updateData.imageUrl = metadataResult.imageUrl
        }

        if (Object.keys(updateData).length > 0) {
          await ctx.runMutation(internal.bookmarks.internal.updateBookmarkMetadata, {
            bookmarkId: args.bookmarkId,
            ...updateData,
          })
        }
      }
    } catch (error) {
      console.error('Failed to generate metadata:', error)
    }
  },
})

export const updateBookmarkMetadata = internalMutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: {
      title?: string
      description?: string
      imageUrl?: string
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.title !== undefined) {
      updateData.title = args.title
    }
    if (args.description !== undefined) {
      updateData.description = args.description
    }
    if (args.imageUrl !== undefined) {
      updateData.imageUrl = args.imageUrl
    }

    await ctx.db.patch(args.bookmarkId, updateData)
  },
})

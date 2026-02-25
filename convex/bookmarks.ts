import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const createBookMark = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    groupId: v.id('groups'),
    imageUrl: v.string(),
    doneReading: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentTime = Date.now()

    if (!args.groupId) {
      throw new Error('GroupId not found')
    }

    return await ctx.db.insert('bookmarks', {
      title: args.title,
      description: args.description,
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: false,
      createdAt: currentTime,
    })
  },
})

export const listBookMarks = query({
  args: { groupId: v.id('groups') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bookmarks')
      .withIndex('groupId', (q) => q.eq('groupId', args.groupId))
      .collect()
  },
})

export const deleteBookMark = mutation({
  args: { bookmarkId: v.id('bookmarks') },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) {
      throw new Error('Bookmark not found')
    }
    await ctx.db.delete(args.bookmarkId)
    return { success: true, deletedId: args.bookmarkId }
  },
})

export const renameBookMark = mutation({
  args: { bookmarkId: v.id('bookmarks'), title: v.string() },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) {
      throw new Error('Bookmark not found')
    }
    await ctx.db.patch(args.bookmarkId, {
      title: args.title,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

export const moveBookMark = mutation({
  args: { bookmarkId: v.id('bookmarks'), groupId: v.id('groups') },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) {
      throw new Error('Bookmark not found')
    }
    await ctx.db.patch(args.bookmarkId, {
      groupId: args.groupId,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

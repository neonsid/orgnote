import { v, ConvexError } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth } from './lib/auth'
import { MAX_BOOKMARKS_PER_QUERY } from './lib/constants'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    return await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) => q.eq('userId', userId))
      .take(MAX_BOOKMARKS_PER_QUERY)
  },
})

export const getPublicGroupsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return []
    }

    const profile = await ctx.db
      .query('userProfile')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique()

    if (!profile || !profile.isPublic) {
      return []
    }

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) =>
        q.eq('userId', profile.userId).eq('isPublic', true)
      )
      .take(MAX_BOOKMARKS_PER_QUERY)

    return groups
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    color: v.string(),
  },
  returns: v.id('groups'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const currentTime = Date.now()

    return await ctx.db.insert('groups', {
      title: args.title,
      color: args.color,
      userId: userId,
      isPublic: false,
      createdAt: currentTime,
    })
  },
})

export const renameGroup = mutation({
  args: {
    title: v.string(),
    groupId: v.id('groups'),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const currentTime = Date.now()
    const group = await ctx.db.get(args.groupId)
    if (!group) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      })
    }

    if (group.userId !== userId) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: "You don't own this group",
      })
    }

    return await ctx.db.patch(args.groupId, {
      title: args.title,
      updatedAt: currentTime,
      color: args.color,
    })
  },
})

export const deleteGroup = mutation({
  args: {
    groupId: v.id('groups'),
  },
  returns: v.object({ success: v.boolean(), deletedId: v.id('groups') }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const group = await ctx.db.get(args.groupId)

    if (!group) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Group not found' })
    }

    if (group.userId !== userId) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: "You don't own this group",
      })
    }

    await ctx.db.delete(args.groupId)

    return { success: true, deletedId: args.groupId }
  },
})

export const toggleGroupPublic = mutation({
  args: {
    groupId: v.id('groups'),
  },
  returns: v.object({ success: v.boolean(), isPublic: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const group = await ctx.db.get(args.groupId)

    if (!group) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Group not found' })
    }

    if (group.userId !== userId) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: "You don't own this group",
      })
    }

    const newIsPublic = !group.isPublic

    await ctx.db.patch(args.groupId, {
      isPublic: newIsPublic,
      updatedAt: Date.now(),
    })

    return { success: true, isPublic: newIsPublic }
  },
})

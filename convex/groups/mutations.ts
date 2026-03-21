import { v, ConvexError } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireAuth } from '../lib/auth'

export const create = mutation({
  args: {
    title: v.string(),
    color: v.string(),
  },
  returns: v.id('groups'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    return await ctx.db.insert('groups', {
      title: args.title,
      color: args.color,
      userId: userId,
      isPublic: false,
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

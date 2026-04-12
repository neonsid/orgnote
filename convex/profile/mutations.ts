import { v, ConvexError } from 'convex/values'
import { authMutation } from '../lib/auth'

export const upsertProfile = authMutation({
  args: {
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          label: v.union(
            v.literal('GitHub'),
            v.literal('Twitter'),
            v.literal('Portfolio')
          ),
          url: v.string(),
        })
      )
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

    if (args.username) {
      const existingUserWithUsername = await ctx.db
        .query('userProfile')
        .withIndex('by_username', (q) => q.eq('username', args.username))
        .unique()

      if (
        existingUserWithUsername &&
        existingUserWithUsername.userId !== userId
      ) {
        throw new ConvexError({
          code: 'CONFLICT',
          message: 'Username is already taken',
        })
      }
    }

    const existingProfile = await ctx.db
      .query('userProfile')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    if (existingProfile) {
      const updateData: Record<string, unknown> = {}
      if (args.username !== undefined) updateData.username = args.username
      if (args.bio !== undefined) updateData.bio = args.bio
      if (args.links !== undefined) updateData.links = args.links
      if (args.isPublic !== undefined) updateData.isPublic = args.isPublic

      return await ctx.db.patch(existingProfile._id, updateData)
    } else {
      return await ctx.db.insert('userProfile', {
        userId: userId,
        username: args.username,
        bio: args.bio,
        links: args.links,
        isPublic: args.isPublic ?? false,
      })
    }
  },
})

export const updateUsername = authMutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

    const existingUserWithUsername = await ctx.db
      .query('userProfile')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique()

    if (
      existingUserWithUsername &&
      existingUserWithUsername.userId !== userId
    ) {
      throw new ConvexError({
        code: 'CONFLICT',
        message: 'Username is already taken',
      })
    }

    const existingProfile = await ctx.db
      .query('userProfile')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, {
        username: args.username,
      })
    } else {
      return await ctx.db.insert('userProfile', {
        userId: userId,
        username: args.username,
        isPublic: false,
      })
    }
  },
})

export const updateBio = authMutation({
  args: {
    bio: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

    const existingProfile = await ctx.db
      .query('userProfile')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, { bio: args.bio })
    } else {
      return await ctx.db.insert('userProfile', {
        userId: userId,
        bio: args.bio,
        isPublic: false,
      })
    }
  },
})

export const updateSocialLinks = authMutation({
  args: {
    links: v.array(
      v.object({
        label: v.union(
          v.literal('GitHub'),
          v.literal('Twitter'),
          v.literal('Portfolio')
        ),
        url: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

    const existingProfile = await ctx.db
      .query('userProfile')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, { links: args.links })
    } else {
      return await ctx.db.insert('userProfile', {
        userId: userId,
        links: args.links,
        isPublic: false,
      })
    }
  },
})

export const switchProfileStatus = authMutation({
  args: {
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

    const existingProfile = await ctx.db
      .query('userProfile')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, {
        isPublic: args.isPublic,
      })
    } else {
      return await ctx.db.insert('userProfile', {
        userId: userId,
        isPublic: args.isPublic,
      })
    }
  },
})

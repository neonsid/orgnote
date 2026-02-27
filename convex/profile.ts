import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const addUserName = mutation({
  args: {
    username: v.string(),
    userId: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('UserId not found')
    }

    return await ctx.db.insert('userProfile', {
      username: args.username,
      userProvidedId: args.userId,
      isPublic: args.isPublic ?? false,
    })
  },
})

export const addBio = mutation({
  args: {
    userId: v.string(),
    bio: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('UserId not found')
    }

    return await ctx.db.insert('userProfile', {
      bio: args.bio,
      userProvidedId: args.userId,
      isPublic: args.isPublic ?? false,
    })
  },
})

export const addSocialLinks = mutation({
  args: {
    userId: v.string(),
    links: v.object({
      label: v.union(
        v.literal('GitHub'),
        v.literal('Twitter'),
        v.literal('Portfolio')
      ),
      url: v.string(),
    }),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('UserId not found')
    }

    return await ctx.db.insert('userProfile', {
      links: args.links,
      userProvidedId: args.userId,
      isPublic: args.isPublic ?? false,
    })
  },
})

export const updateSocialLink = mutation({
  args: {
    userId: v.string(),
    userProfileId: v.id('userProfile'),
    links: v.object({
      label: v.union(
        v.literal('GitHub'),
        v.literal('Twitter'),
        v.literal('Portfolio')
      ),
      url: v.string(),
    }),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('UserId not found')
    }

    return await ctx.db.patch(args.userProfileId, {
      links: args.links,
      userProvidedId: args.userId,
      isPublic: args.isPublic ?? false,
    })
  },
})
export const switchProfileStatus = mutation({
  args: {
    userProfileId: v.id('userProfile'),
    userId: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('UserId not found')
    }

    return await ctx.db.patch(args.userProfileId, {
      userProvidedId: args.userId,
      isPublic: args.isPublic,
    })
  },
})

export const completeWholeProfile = mutation({
  args: {
    isPublic: v.boolean(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.optional(
      v.object({
        label: v.union(
          v.literal('GitHub'),
          v.literal('Twitter'),
          v.literal('Portfolio')
        ),
        url: v.string(),
      })
    ),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('UserId not found')
    }

    return await ctx.db.insert('userProfile', {
      username: args.username,
      bio: args.bio,
      links: args.links,
      userProvidedId: args.userId,
      isPublic: args.isPublic ?? false,
    })
  },
})

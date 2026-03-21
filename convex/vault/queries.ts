import { v } from 'convex/values'
import { query } from '../_generated/server'
import { requireAuth } from '../lib/auth'

export const getFiles = query({
  args: { groupId: v.optional(v.id('vaultGroups')) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (args.groupId !== undefined) {
      const files = await ctx.db
        .query('vaultFiles')
        .withIndex('by_owner_group', (q) =>
          q.eq('ownerId', userId).eq('groupId', args.groupId)
        )
        .collect()
      return files.sort((a, b) => b._creationTime - a._creationTime)
    }

    const files = await ctx.db
      .query('vaultFiles')
      .withIndex('by_owner', (q) => q.eq('ownerId', userId))
      .collect()

    return files.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const getVaultGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    return await ctx.db
      .query('vaultGroups')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
  },
})

export const getVaultData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const [groups, files] = await Promise.all([
      ctx.db
        .query('vaultGroups')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('vaultFiles')
        .withIndex('by_owner', (q) => q.eq('ownerId', userId))
        .collect(),
    ])

    return {
      groups,
      files: files.map((f) => ({
        _id: f._id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.url,
        thumbnailUrl: f.thumbnailUrl,
        groupId: f.groupId,
        ownerId: f.ownerId,
        _creationTime: f._creationTime,
      })),
    }
  },
})

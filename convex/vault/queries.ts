import { v } from 'convex/values'
import { authQuery } from '../lib/auth'

export const getVaultUploadRequest = authQuery({
  args: { requestId: v.id('vaultUploadRequests') },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('vaultUploadRequests'),
      _creationTime: v.number(),
      ownerId: v.string(),
      fileName: v.string(),
      fileType: v.string(),
      status: v.union(
        v.literal('pending'),
        v.literal('ready'),
        v.literal('failed')
      ),
      uploadUrl: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      fileKey: v.optional(v.string()),
      error: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const { userId } = ctx
    const row = await ctx.db.get(args.requestId)
    if (!row || row.ownerId !== userId) {
      return null
    }
    return row
  },
})

export const getFiles = authQuery({
  args: { groupId: v.optional(v.id('vaultGroups')) },
  handler: async (ctx, args) => {
    const { userId } = ctx

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

export const getVaultGroups = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    return await ctx.db
      .query('vaultGroups')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
  },
})

export const getVaultData = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
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

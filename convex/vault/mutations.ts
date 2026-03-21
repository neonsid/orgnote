import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { ConvexError } from 'convex/values'
import { internal } from '../_generated/api'
import { R2_PUBLIC_URL } from '../lib/constants'

export const deleteFile = mutation({
  args: { fileId: v.id('vaultFiles') },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new ConvexError('File not found')
    }

    if (file.ownerId !== userId) {
      throw new ConvexError('Not authorized to delete this file')
    }

    const fileKey = file.url.replace(`${R2_PUBLIC_URL}/`, '')
    const thumbnailFileKey = file.thumbnailUrl
      ? file.thumbnailUrl.replace(`${R2_PUBLIC_URL}/`, '')
      : undefined

    await ctx.db.delete(args.fileId)

    await ctx.scheduler.runAfter(0, internal.vault_node.deleteFromR2, {
      fileKey,
      thumbnailFileKey,
    })

    return { success: true }
  },
})

export const saveFileMetadata = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    groupId: v.optional(v.id('vaultGroups')),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const fileId = await ctx.db.insert('vaultFiles', {
      name: args.fileName,
      type: args.fileType,
      size: args.fileSize,
      url: args.fileUrl,
      thumbnailUrl: args.thumbnailUrl,
      groupId: args.groupId,
      ownerId: userId,
    })

    return fileId
  },
})

export const createVaultGroup = mutation({
  args: { title: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const groupId = await ctx.db.insert('vaultGroups', {
      title: args.title,
      color: args.color,
      userId,
    })
    return groupId
  },
})

export const deleteVaultGroup = mutation({
  args: { groupId: v.id('vaultGroups') },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const group = await ctx.db.get(args.groupId)
    if (!group) {
      throw new ConvexError('Vault group not found')
    }
    if (group.userId !== userId) {
      throw new ConvexError('Not authorized')
    }
    await ctx.db.delete(args.groupId)
    return true
  },
})

import { v } from 'convex/values'
import { authMutation } from '../lib/auth'
import { ConvexError } from 'convex/values'
import { internal } from '../_generated/api'
import {
  ALLOWED_FILE_TYPES,
  MAX_FILENAME_LENGTH,
  R2_PUBLIC_URL,
} from '../lib/constants'

function validateFileNameAndType(fileName: string, fileType: string): void {
  if (fileName.length > MAX_FILENAME_LENGTH) {
    throw new ConvexError('Filename too long')
  }
  if (!fileName || fileName.trim() === '') {
    throw new ConvexError('Filename is required')
  }
  if (!fileType || fileType.trim() === '') {
    throw new ConvexError('File type is required')
  }
  const isAllowedType = ALLOWED_FILE_TYPES.some((type) =>
    fileType.startsWith(type)
  )
  if (!isAllowedType) {
    throw new ConvexError('File type not allowed')
  }
}

/** Client calls this instead of a public action; intent is stored then an internal action runs. */
export const requestPresignedUploadUrl = authMutation({
  args: { fileName: v.string(), fileType: v.string() },
  returns: v.id('vaultUploadRequests'),
  handler: async (ctx, args) => {
    const { userId } = ctx
    validateFileNameAndType(args.fileName, args.fileType)

    const requestId = await ctx.db.insert('vaultUploadRequests', {
      ownerId: userId,
      fileName: args.fileName,
      fileType: args.fileType,
      status: 'pending',
    })

    await ctx.scheduler.runAfter(0, internal.vault_node.completeVaultUploadRequest, {
      requestId,
    })

    return requestId
  },
})

export const deleteFile = authMutation({
  args: { fileId: v.id('vaultFiles') },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = ctx

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

export const saveFileMetadata = authMutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    groupId: v.optional(v.id('vaultGroups')),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

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

export const createVaultGroup = authMutation({
  args: { title: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    const { userId } = ctx
    const groupId = await ctx.db.insert('vaultGroups', {
      title: args.title,
      color: args.color,
      userId,
    })
    return groupId
  },
})

export const renameVaultGroup = authMutation({
  args: {
    groupId: v.id('vaultGroups'),
    title: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx
    const group = await ctx.db.get(args.groupId)
    if (!group) {
      throw new ConvexError('Vault group not found')
    }
    if (group.userId !== userId) {
      throw new ConvexError('Not authorized')
    }
    await ctx.db.patch(args.groupId, {
      title: args.title,
      color: args.color,
    })
    return true
  },
})

export const deleteVaultGroup = authMutation({
  args: { groupId: v.id('vaultGroups') },
  handler: async (ctx, args) => {
    const { userId } = ctx
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

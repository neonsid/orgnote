import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

export const getVaultUploadRequestRow = internalQuery({
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
    return await ctx.db.get(args.requestId)
  },
})

export const setVaultUploadRequestReady = internalMutation({
  args: {
    requestId: v.id('vaultUploadRequests'),
    uploadUrl: v.string(),
    fileUrl: v.string(),
    fileKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: 'ready',
      uploadUrl: args.uploadUrl,
      fileUrl: args.fileUrl,
      fileKey: args.fileKey,
    })
    return null
  },
})

export const setVaultUploadRequestFailed = internalMutation({
  args: {
    requestId: v.id('vaultUploadRequests'),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: 'failed',
      error: args.error,
    })
    return null
  },
})

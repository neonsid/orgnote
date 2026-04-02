'use node'

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  MAX_FILENAME_LENGTH,
  ALLOWED_FILE_TYPES,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from './lib/constants'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  tls: true,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

function validateFileInput(fileName: string, fileType: string): void {
  if (fileName.length > MAX_FILENAME_LENGTH) {
    throw new Error('Filename too long')
  }

  if (!fileName || fileName.trim() === '') {
    throw new Error('Filename is required')
  }

  if (!fileType || fileType.trim() === '') {
    throw new Error('File type is required')
  }

  const isAllowedType = ALLOWED_FILE_TYPES.some((type) =>
    fileType.startsWith(type)
  )
  if (!isAllowedType) {
    throw new Error('File type not allowed')
  }
}

function generateFileKey(fileName: string): string {
  const uuid = crypto.randomUUID()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${uuid}-${sanitizedFileName}`
}

/** Scheduled by `vault/mutations.requestPresignedUploadUrl` — not called from the client. */
export const completeVaultUploadRequest = internalAction({
  args: { requestId: v.id('vaultUploadRequests') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.runQuery(internal.vault.internal.getVaultUploadRequestRow, {
      requestId: args.requestId,
    })
    if (!row || row.status !== 'pending') {
      return null
    }

    try {
      validateFileInput(row.fileName, row.fileType)

      const fileKey = generateFileKey(row.fileName)
      const contentType = row.fileType

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType,
      })

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      })
      const fileUrl = `${R2_PUBLIC_URL}/${fileKey}`

      await ctx.runMutation(internal.vault.internal.setVaultUploadRequestReady, {
        requestId: args.requestId,
        uploadUrl: signedUrl,
        fileUrl,
        fileKey,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to prepare upload'
      await ctx.runMutation(internal.vault.internal.setVaultUploadRequestFailed, {
        requestId: args.requestId,
        error: message,
      })
    }

    return null
  },
})

/** R2 cleanup after DB delete. Internal actions have no user JWT; ownership is enforced in `vault.deleteFile`. */
export const deleteFromR2 = internalAction({
  args: {
    fileKey: v.string(),
    thumbnailFileKey: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: args.fileKey,
      })
    )

    if (args.thumbnailFileKey) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: args.thumbnailFileKey,
        })
      )
    }
  },
})

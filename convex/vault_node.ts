'use node'

import { v } from 'convex/values'
import { action, internalAction } from './_generated/server'
import { requireAuth } from './lib/auth'
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

export const getPresignedUploadUrl = action({
  args: { fileName: v.string(), fileType: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    validateFileInput(args.fileName, args.fileType)

    const fileKey = generateFileKey(userId)
    const contentType = args.fileType

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    })
    const fileUrl = `${R2_PUBLIC_URL}/${fileKey}`

    return {
      uploadUrl: signedUrl,
      fileUrl,
      fileKey,
    }
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

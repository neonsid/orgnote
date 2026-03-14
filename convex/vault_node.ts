'use node'

import { v } from 'convex/values'
import { action, internalAction } from './_generated/server'
import { api, internal } from './_generated/api'
import { requireAuth } from './lib/auth'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

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

function generateFileKey(ownerId: string, fileName: string): string {
  const uuid = crypto.randomUUID()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${ownerId}/${uuid}-${sanitizedFileName}`
}

export const getPresignedUploadUrl = action({
  args: { fileName: v.string(), fileType: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    console.log('R2 config:', {
      accountId: R2_ACCOUNT_ID ? 'set' : 'missing',
      bucket: R2_BUCKET_NAME ? 'set' : 'missing',
      accessKeyId: R2_ACCESS_KEY_ID ? 'set' : 'missing',
      secretKeySet: !!R2_SECRET_ACCESS_KEY,
    })

    const fileKey = generateFileKey(userId, args.fileName)
    const contentType = args.fileType

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const fileUrl = `${R2_PUBLIC_URL}/${fileKey}`

    return {
      uploadUrl: signedUrl,
      fileUrl,
      fileKey,
    }
  },
})

export const deleteFromR2 = internalAction({
  args: {
    fileKey: v.string(),
    fileId: v.id('vaultFiles'),
  },
  handler: async (ctx, args) => {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: args.fileKey,
    })
    await s3Client.send(command)

    // Now delete from DB using scheduler to call mutation
    await ctx.scheduler.runAfter(0, internal.vault.deleteFileFromDb, {
      fileId: args.fileId,
    })
  },
})

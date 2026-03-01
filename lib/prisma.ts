import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaPg } from '@prisma/adapter-pg'

const isDev = process.env.NODE_ENV === 'development'
console.log('IsDev: ', isDev)
const databaseUrl = isDev
  ? process.env.DEV_DATABASE_URL
  : process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

let prisma: PrismaClient

if (isDev) {
  const adapter = new PrismaPg({ connectionString: databaseUrl })
  prisma = new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
  })
} else {
  prisma = new PrismaClient({
    accelerateUrl: databaseUrl,
  }).$extends(withAccelerate()) as unknown as PrismaClient
}

export { prisma }

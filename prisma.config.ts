import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const isDev = process.env.NODE_ENV === 'development'
const databaseUrl = isDev ? process.env.DIRECT_URL : process.env.DATABASE_URL
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env(databaseUrl!),
  },
})

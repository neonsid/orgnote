import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetTemplate,
} from './email'
import { be } from 'zod/v4/locales'

// Sync user to Convex database via HTTP action
async function syncUserToConvex(user: {
  id: string
  name: string
  email: string
}) {
  try {
    // Use the site URL for HTTP actions (.convex.site domain)
    const convexSiteUrl =
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
        '.convex.cloud',
        '.convex.site'
      )

    if (!convexSiteUrl) {
      console.error('Convex URL not set')
      return
    }

    console.log('Syncing user to Convex:', user.id, 'at', convexSiteUrl)

    const response = await fetch(`${convexSiteUrl}/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProvidedId: user.id,
        name: user.name,
        email: user.email,
      }),
    })

    if (!response.ok) {
      console.error('Failed to sync user to Convex:', await response.text())
    } else {
      const result = await response.json()
      console.log('User synced to Convex successfully:', result)
    }
  } catch (error) {
    console.error('Error syncing user to Convex:', error)
  }
}

const betterAuthUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.BETTER_AUTH_URL

if (!betterAuthUrl) {
  throw new Error('DB URL for better auth not configured')
}

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log(
            '[BetterAuth] User create BEFORE hook triggered:',
            user.id
          )
          return { data: user }
        },
        after: async (user) => {
          console.log('[BetterAuth] User create AFTER hook triggered:', user.id)
          // Sync user to Convex after creation
          await syncUserToConvex({
            id: user.id,
            name: user.name,
            email: user.email,
          })
        },
      },
      update: {
        after: async (user) => {
          console.log('[BetterAuth] User update AFTER hook triggered:', user.id)
          // Sync user to Convex after update
          await syncUserToConvex({
            id: user.id,
            name: user.name,
            email: user.email,
          })
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url, token }, request) => {
      const { text, html } = getPasswordResetTemplate(url)
      void sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text,
        html,
      })
    },
    onPasswordReset: async ({ user }, request) => {
      // Optional: Add post-password reset logic here
      console.log(`Password for user ${user.email} has been reset.`)
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const { text, html } = getVerificationEmailTemplate(url)
      void sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        text,
        html,
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
})

import { httpRouter } from 'convex/server'
import { httpAction, internalAction } from './_generated/server'
import { api, internal } from './_generated/api'
import { rateLimiter } from './rate_limit'
import { v } from 'convex/values'

const http = httpRouter()

// Internal action with rate limiting for user sync
export const syncUserWithRateLimit = internalAction({
  args: {
    userProvidedId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit for sync operations
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'syncUser', {
      key: args.userProvidedId,
    })

    if (!ok) {
      throw new Error(`Rate limit exceeded. Try again after ${retryAfter}ms`)
    }

    // Call the mutation to create or update user
    const result = await ctx.runMutation(api.users.createOrUpdateUser, {
      userProvidedId: args.userProvidedId,
      name: args.name,
      email: args.email,
    })

    return result
  },
})

http.route({
  path: '/sync-user',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json()
      const { userProvidedId, name, email } = body

      if (!userProvidedId || !name || !email) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Validate userProvidedId format (should be a non-empty string)
      if (typeof userProvidedId !== 'string' || userProvidedId.length < 1) {
        return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Call the rate-limited action
      const result = await ctx.runAction(internal.http.syncUserWithRateLimit, {
        userProvidedId,
        name,
        email,
      })

      return new Response(JSON.stringify({ success: true, userId: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error syncing user:', error)

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('Rate limit')) {
        return new Response(
          JSON.stringify({
            error: 'Too many requests. Please try again later.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }),
})

export default http

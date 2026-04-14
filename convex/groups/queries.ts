import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authQuery } from '../lib/auth'
import { MAX_GROUPS_PER_QUERY } from '../lib/constants'

export const list = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    return await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) => q.eq('userId', userId))
      .order('desc')
      .take(MAX_GROUPS_PER_QUERY)
  },
})

export const getPublicGroupsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return []
    }

    const profile = await ctx.db
      .query('userProfile')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique()

    if (!profile || !profile.isPublic) {
      return []
    }

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) =>
        q.eq('userId', profile.userId).eq('isPublic', true)
      )
      .take(MAX_GROUPS_PER_QUERY)

    return groups
  },
})

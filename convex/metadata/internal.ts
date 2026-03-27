import { internalQuery, internalMutation } from '../_generated/server'
import { v } from 'convex/values'
import { SCIRA_DAILY_LIMIT } from '../lib/constants'
import { bookmarkDescriptionReturnsValidator } from './validators'

export const getBookmarkDescriptionJobRow = internalQuery({
  args: { jobId: v.id('bookmarkDescriptionJobs') },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('bookmarkDescriptionJobs'),
      _creationTime: v.number(),
      ownerId: v.string(),
      url: v.string(),
      status: v.union(v.literal('pending'), v.literal('complete')),
      success: v.optional(v.boolean()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      error: v.optional(v.string()),
      remainingSciraQuota: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId)
  },
})

export const finalizeBookmarkDescriptionJob = internalMutation({
  args: {
    jobId: v.id('bookmarkDescriptionJobs'),
    result: bookmarkDescriptionReturnsValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: 'complete',
      success: args.result.success,
      title: args.result.title,
      description: args.result.description,
      imageUrl: args.result.imageUrl,
      error: args.result.error,
      remainingSciraQuota: args.result.remainingSciraQuota,
    })
    return null
  },
})

export const checkSciraQuotaInternal = internalQuery({
  args: {
    userId: v.string(),
    today: v.string(),
  },
  returns: v.object({
    hasQuota: v.boolean(),
    remaining: v.number(),
    currentCount: v.number(),
    usageId: v.optional(v.id('sciraUsage')),
  }),
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query('sciraUsage')
      .withIndex('by_userId_and_date', (q) =>
        q.eq('userId', args.userId).eq('date', args.today)
      )
      .unique()

    const currentCount = usage?.requestCount ?? 0
    const remaining = Math.max(0, SCIRA_DAILY_LIMIT - currentCount)

    return {
      hasQuota: remaining > 0,
      remaining,
      currentCount,
      usageId: usage?._id,
    }
  },
})

export const incrementSciraQuotaInternal = internalMutation({
  args: {
    userId: v.string(),
    usageId: v.optional(v.id('sciraUsage')),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]

    if (args.usageId) {
      const usage = await ctx.db.get(args.usageId)
      if (usage) {
        await ctx.db.patch(args.usageId, {
          requestCount: usage.requestCount + 1,
        })
      }
    } else {
      await ctx.db.insert('sciraUsage', {
        userId: args.userId,
        date: today,
        requestCount: 1,
      })
    }

    return { success: true }
  },
})

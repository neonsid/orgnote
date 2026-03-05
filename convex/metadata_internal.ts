import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const SCIRA_DAILY_LIMIT = 20;

/**
 * Internal Query: Check Scira quota for a user
 */
export const checkSciraQuotaInternal = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    hasQuota: v.boolean(),
    remaining: v.number(),
    currentCount: v.number(),
    usageId: v.optional(v.id("sciraUsage")),
  }),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const usage = await ctx.db
      .query("sciraUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userProvidedId", args.userId).eq("date", today),
      )
      .first();

    const currentCount = usage?.requestCount ?? 0;
    const remaining = Math.max(0, SCIRA_DAILY_LIMIT - currentCount);

    return {
      hasQuota: remaining > 0,
      remaining,
      currentCount,
      usageId: usage?._id,
    };
  },
});

/**
 * Internal Mutation: Increment Scira quota for a user
 */
export const incrementSciraQuotaInternal = internalMutation({
  args: {
    userId: v.string(),
    usageId: v.optional(v.id("sciraUsage")),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (args.usageId) {
      const usage = await ctx.db.get(args.usageId);
      if (usage) {
        await ctx.db.patch(args.usageId, {
          requestCount: usage.requestCount + 1,
        });
      }
    } else {
      await ctx.db.insert("sciraUsage", {
        userProvidedId: args.userId,
        date: today,
        requestCount: 1,
      });
    }

    return { success: true };
  },
});

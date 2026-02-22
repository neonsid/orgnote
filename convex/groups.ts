import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    color: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentTime = Date.now();

    if (!args.userId) {
      throw new Error("UserId not found");
    }

    return await ctx.db.insert("groups", {
      title: args.title,
      color: args.color,
      userProvidedId: args.userId,
      createdAt: currentTime,
    });
  },
});

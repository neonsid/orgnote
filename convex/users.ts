import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createOrUpdateUser = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        userId: args.userId,
        name: args.name,
        email: args.email,
      });
    }
  },
});

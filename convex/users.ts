import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createOrUpdateUser = mutation({
  args: {
    userProvidedId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userProvidedId),
      )
      .first();

    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
      });
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        userProvidedId: args.userProvidedId,
        name: args.name,
        email: args.email,
      });
    }
  },
});

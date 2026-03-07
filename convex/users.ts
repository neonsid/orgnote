import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createOrUpdateUser = internalMutation({
  args: {
    userProvidedId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userProvidedId),
      )
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
      });
      return existingUser._id;
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

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .first();

    return profile;
  },
});

export const getProfileByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.username) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    // Only return public profiles
    if (!profile || !profile.isPublic) {
      return null;
    }

    return profile;
  },
});

export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          label: v.union(
            v.literal("GitHub"),
            v.literal("Twitter"),
            v.literal("Portfolio"),
          ),
          url: v.string(),
        }),
      ),
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId not found");
    }

    // Check for duplicate username if username is being set
    if (args.username) {
      const existingUserWithUsername = await ctx.db
        .query("userProfile")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      if (
        existingUserWithUsername &&
        existingUserWithUsername.userProvidedId !== args.userId
      ) {
        throw new Error("Username is already taken");
      }
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .first();

    if (existingProfile) {
      // Update existing profile with only provided fields
      const updateData: Record<string, unknown> = {};
      if (args.username !== undefined) updateData.username = args.username;
      if (args.bio !== undefined) updateData.bio = args.bio;
      if (args.links !== undefined) updateData.links = args.links;
      if (args.isPublic !== undefined) updateData.isPublic = args.isPublic;

      return await ctx.db.patch(existingProfile._id, updateData);
    } else {
      // Create new profile
      return await ctx.db.insert("userProfile", {
        userProvidedId: args.userId,
        username: args.username,
        bio: args.bio,
        links: args.links,
        isPublic: args.isPublic ?? false,
      });
    }
  },
});

export const updateUsername = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId not found");
    }

    // Check for duplicate username
    const existingUserWithUsername = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (
      existingUserWithUsername &&
      existingUserWithUsername.userProvidedId !== args.userId
    ) {
      throw new Error("Username is already taken");
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .first();

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, {
        username: args.username,
      });
    } else {
      return await ctx.db.insert("userProfile", {
        userProvidedId: args.userId,
        username: args.username,
        isPublic: false,
      });
    }
  },
});

export const updateBio = mutation({
  args: {
    userId: v.string(),
    bio: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId not found");
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .first();

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, { bio: args.bio });
    } else {
      return await ctx.db.insert("userProfile", {
        userProvidedId: args.userId,
        bio: args.bio,
        isPublic: false,
      });
    }
  },
});

export const updateSocialLinks = mutation({
  args: {
    userId: v.string(),
    links: v.array(
      v.object({
        label: v.union(
          v.literal("GitHub"),
          v.literal("Twitter"),
          v.literal("Portfolio"),
        ),
        url: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId not found");
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .first();

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, { links: args.links });
    } else {
      return await ctx.db.insert("userProfile", {
        userProvidedId: args.userId,
        links: args.links,
        isPublic: false,
      });
    }
  },
});

export const switchProfileStatus = mutation({
  args: {
    userId: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId not found");
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .first();

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, {
        isPublic: args.isPublic,
      });
    } else {
      return await ctx.db.insert("userProfile", {
        userProvidedId: args.userId,
        isPublic: args.isPublic,
      });
    }
  },
});

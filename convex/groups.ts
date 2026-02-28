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

export const getPublicGroupsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return [];
    }

    // First get the user profile
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!profile || !profile.isPublic) {
      return [];
    }

    // Get all public groups for this user
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user_public", (q) =>
        q.eq("userProvidedId", profile.userProvidedId).eq("isPublic", true),
      )
      .collect();

    return groups;
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
      isPublic: false,
      createdAt: currentTime,
    });
  },
});

export const deleteGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    // Verify ownership
    if (group.userProvidedId !== args.userId) {
      throw new Error("Forbidden: You don't own this group");
    }

    // Safe to delete
    await ctx.db.delete(args.groupId);

    return { success: true, deletedId: args.groupId };
  },
});

export const toggleGroupPublic = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    // Verify ownership
    if (group.userProvidedId !== args.userId) {
      throw new Error("Forbidden: You don't own this group");
    }

    // Toggle the isPublic status
    const newIsPublic = !group.isPublic;

    await ctx.db.patch(args.groupId, {
      isPublic: newIsPublic,
      updatedAt: Date.now(),
    });

    return { success: true, isPublic: newIsPublic };
  },
});

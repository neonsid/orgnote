import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  fetchGroupBookmarksByGroupId,
  MAX_BOOKMARKS_PER_QUERY,
} from "./bookmark_helpers";

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function requireUserId(userId: string): void {
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "UserId not found" });
  }
}

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

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
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .unique();

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
      .unique();

    // Only return public profiles
    if (!profile || !profile.isPublic) {
      return null;
    }

    // Fetch user data to get the full name
    const user = await ctx.db
      .query("users")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", profile.userProvidedId),
      )
      .unique();

    return {
      ...profile,
      name: user?.name || profile.username,
    };
  },
});

export const getPublicProfileData = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return null;
    }

    // Single query to get profile
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!profile || !profile.isPublic) {
      return null;
    }

    // Fetch user data for full name
    const user = await ctx.db
      .query("users")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", profile.userProvidedId),
      )
      .unique();

    // Fetch public groups
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userProvidedId_and_isPublic", (q) =>
        q.eq("userProvidedId", profile.userProvidedId).eq("isPublic", true),
      )
      .take(MAX_BOOKMARKS_PER_QUERY);

    // Fetch bookmarks for all public groups
    const bookmarks: {
      _id: string;
      title: string;
      url: string;
      description?: string;
      imageUrl: string;
      doneReading: boolean;
      createdAt: number;
      groupId: string;
      groupTitle: string;
      groupColor: string;
    }[] = [];

    for (const group of groups) {
      const groupBookmarks = await fetchGroupBookmarksByGroupId(
        ctx, group._id,
      );

      for (const bookmark of groupBookmarks) {
        bookmarks.push({
          _id: bookmark._id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          imageUrl: bookmark.imageUrl,
          doneReading: bookmark.doneReading,
          createdAt: bookmark.createdAt,
          groupId: group._id,
          groupTitle: group.title,
          groupColor: group.color,
        });
      }
    }

    bookmarks.sort((a, b) => b.createdAt - a.createdAt);

    return {
      profile: {
        ...profile,
        name: user?.name || profile.username,
      },
      groups,
      bookmarks,
    };
  },
});

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

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
    requireUserId(args.userId);

    // Check for duplicate username if username is being set
    if (args.username) {
      const existingUserWithUsername = await ctx.db
        .query("userProfile")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique();

      if (
        existingUserWithUsername &&
        existingUserWithUsername.userProvidedId !== args.userId
      ) {
        throw new ConvexError({ code: "CONFLICT", message: "Username is already taken" });
      }
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .unique();

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
    requireUserId(args.userId);

    // Check for duplicate username
    const existingUserWithUsername = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (
      existingUserWithUsername &&
      existingUserWithUsername.userProvidedId !== args.userId
    ) {
      throw new ConvexError({ code: "CONFLICT", message: "Username is already taken" });
    }

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .unique();

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
    requireUserId(args.userId);

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .unique();

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
    requireUserId(args.userId);

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .unique();

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
    requireUserId(args.userId);

    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userProvidedId", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .unique();

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

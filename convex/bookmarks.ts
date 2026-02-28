import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createBookMark = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    groupId: v.id("groups"),
    imageUrl: v.string(),
    doneReading: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentTime = Date.now();

    if (!args.groupId) {
      throw new Error("GroupId not found");
    }

    return await ctx.db.insert("bookmarks", {
      title: args.title,
      description: args.description,
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: false,
      createdAt: currentTime,
    });
  },
});

export const listBookMarks = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookmarks")
      .withIndex("groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const getBookmarksByGroupIds = query({
  args: { groupIds: v.array(v.id("groups")) },
  handler: async (ctx, args) => {
    const bookmarks = [];
    for (const groupId of args.groupIds) {
      const groupBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("groupId", (q) => q.eq("groupId", groupId))
        .collect();
      const group = await ctx.db.get(groupId);
      for (const bookmark of groupBookmarks) {
        bookmarks.push({
          ...bookmark,
          groupTitle: group?.title || "Unknown",
        });
      }
    }
    return bookmarks;
  },
});

export const getBookmarkCountsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .collect();

    const counts: Record<string, number> = {};
    for (const group of groups) {
      const groupBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("groupId", (q) => q.eq("groupId", group._id))
        .collect();
      counts[group._id] = groupBookmarks.length;
    }
    return counts;
  },
});

export const deleteBookMark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }
    await ctx.db.delete(args.bookmarkId);
    return { success: true, deletedId: args.bookmarkId };
  },
});

export const renameBookMark = mutation({
  args: { bookmarkId: v.id("bookmarks"), title: v.string() },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }
    await ctx.db.patch(args.bookmarkId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const markAsDone = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }
    await ctx.db.patch(args.bookmarkId, {
      doneReading: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const toggleReadStatus = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }
    await ctx.db.patch(args.bookmarkId, {
      doneReading: !bookmark.doneReading,
      updatedAt: Date.now(),
    });
    return { success: true, doneReading: !bookmark.doneReading };
  },
});
export const moveBookMark = mutation({
  args: { bookmarkId: v.id("bookmarks"), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }
    await ctx.db.patch(args.bookmarkId, {
      groupId: args.groupId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const getAllUserBookmarks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user_provided_id", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .collect();

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
    }[] = [];

    for (const group of groups) {
      const groupBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("groupId", (q) => q.eq("groupId", group._id))
        .collect();

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
        });
      }
    }

    return bookmarks;
  },
});

export const getPublicBookmarksByUsername = query({
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
      const groupBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("groupId", (q) => q.eq("groupId", group._id))
        .collect();

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

    // Sort by createdAt descending
    bookmarks.sort((a, b) => b.createdAt - a.createdAt);

    return bookmarks;
  },
});

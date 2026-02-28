import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel, Id } from "./_generated/dataModel";

const MAX_URL_LENGTH = 2000;
const ALLOWED_URL_PROTOCOLS = ["http:", "https:"];

function isValidUrl(url: string): boolean {
  if (!url || url.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return ALLOWED_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

async function verifyBookmarkOwnership(
  ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
  bookmarkId: Id<"bookmarks">,
  userId: string,
): Promise<void> {
  const bookmark = await ctx.db.get(bookmarkId);
  if (!bookmark) {
    throw new Error("Bookmark not found");
  }

  const group = await ctx.db.get(bookmark.groupId);
  if (!group) {
    throw new Error("Group not found");
  }

  if (group.userProvidedId !== userId) {
    throw new Error("Forbidden: You don't own this bookmark");
  }
}

async function verifyGroupOwnership(
  ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
  groupId: Id<"groups">,
  userId: string,
): Promise<void> {
  const group = await ctx.db.get(groupId);
  if (!group) {
    throw new Error("Group not found");
  }
  if (group.userProvidedId !== userId) {
    throw new Error("Forbidden: You don't own this group");
  }
}

export const createBookMark = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    groupId: v.id("groups"),
    imageUrl: v.string(),
    doneReading: v.optional(v.boolean()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    if (!args.groupId) {
      throw new Error("GroupId not found");
    }

    if (!isValidUrl(args.url)) {
      throw new Error("Invalid URL format");
    }

    await verifyGroupOwnership(ctx, args.groupId, args.userId);

    const currentTime = Date.now();

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
  args: { groupId: v.id("groups"), userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    await verifyGroupOwnership(ctx, args.groupId, args.userId);

    return await ctx.db
      .query("bookmarks")
      .withIndex("groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const getBookmarksByGroupIds = query({
  args: { groupIds: v.array(v.id("groups")), userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    const bookmarks: Array<{
      _id: string;
      _creationTime: number;
      title: string;
      description?: string;
      url: string;
      imageUrl: string;
      doneReading: boolean;
      createdAt: number;
      updatedAt?: number;
      groupId: string;
      groupTitle: string;
    }> = [];

    for (const groupId of args.groupIds) {
      await verifyGroupOwnership(ctx, groupId, args.userId);

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
  args: { bookmarkId: v.id("bookmarks"), userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId);

    await ctx.db.delete(args.bookmarkId);
    return { success: true, deletedId: args.bookmarkId };
  },
});

export const renameBookMark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId);

    await ctx.db.patch(args.bookmarkId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const markAsDone = mutation({
  args: { bookmarkId: v.id("bookmarks"), userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId);

    await ctx.db.patch(args.bookmarkId, {
      doneReading: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const toggleReadStatus = mutation({
  args: { bookmarkId: v.id("bookmarks"), userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId);

    const newDoneReading = !bookmark.doneReading;
    await ctx.db.patch(args.bookmarkId, {
      doneReading: newDoneReading,
      updatedAt: Date.now(),
    });
    return { success: true, doneReading: newDoneReading };
  },
});

export const moveBookMark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    groupId: v.id("groups"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("UserId is required");
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId);
    await verifyGroupOwnership(ctx, args.groupId, args.userId);

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

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!profile || !profile.isPublic) {
      return [];
    }

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

    bookmarks.sort((a, b) => b.createdAt - a.createdAt);

    return bookmarks;
  },
});

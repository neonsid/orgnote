import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { GenericQueryCtx } from "convex/server";
import { mutation, query } from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";
import {
  isValidUrl,
  requireUserId,
  verifyBookmarkOwnership,
  verifyGroupOwnership,
  fetchGroupBookmarks,
  fetchGroupBookmarksByGroupId,
  MAX_BOOKMARKS_PER_QUERY,
} from "./bookmark_helpers";

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

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
  returns: v.id("bookmarks"),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);
    // TODO: Replace userId arg with ctx.auth.getUserIdentity() when Convex auth is configured

    if (!args.groupId) {
      throw new ConvexError({ code: "INVALID_ARGS", message: "GroupId not found" });
    }

    if (!isValidUrl(args.url)) {
      throw new ConvexError({ code: "INVALID_ARGS", message: "Invalid URL format" });
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

export const deleteBookMark = mutation({
  args: { bookmarkId: v.id("bookmarks"), userId: v.string() },
  returns: v.object({ success: v.boolean(), deletedId: v.id("bookmarks") }),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

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
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

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
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

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
  returns: v.object({ success: v.boolean(), doneReading: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Bookmark not found" });
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
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

    await Promise.all([
      verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId),
      verifyGroupOwnership(ctx, args.groupId, args.userId),
    ]);

    await ctx.db.patch(args.bookmarkId, {
      groupId: args.groupId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const updateBookmarkDetails = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

    // Verify ownership
    await verifyBookmarkOwnership(ctx, args.bookmarkId, args.userId);

    const updateData: {
      title?: string;
      url?: string;
      description?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title;
    }

    if (args.url !== undefined) {
      if (!isValidUrl(args.url)) {
        throw new ConvexError({ code: "INVALID_ARGS", message: "Invalid URL format" });
      }
      updateData.url = args.url;
    }

    if (args.description !== undefined) {
      updateData.description = args.description;
    }

    await ctx.db.patch(args.bookmarkId, updateData);

    return { success: true };
  },
});

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export const listBookMarks = query({
  args: { groupId: v.id("groups"), userId: v.string() },
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

    await verifyGroupOwnership(ctx, args.groupId, args.userId);

    return await fetchGroupBookmarks(ctx, args.groupId);
  },
});

// Granular query - returns only fields needed for list view
export const listBookmarksMinimal = query({
  args: { groupId: v.id("groups"), userId: v.string() },
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

    await verifyGroupOwnership(ctx, args.groupId, args.userId);

    const bookmarks = await fetchGroupBookmarks(ctx, args.groupId);

    // Return only fields needed for list view
    return bookmarks.map((b) => ({
      _id: b._id,
      title: b.title,
      url: b.url,
      doneReading: b.doneReading,
      createdAt: b.createdAt,
      groupId: b.groupId,
    }));
  },
});

// Unified dashboard query - returns groups + all bookmarks for initial load
export const getDashboardData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

    // Fetch all groups for user (using compound index prefix query)
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userProvidedId_and_isPublic", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .order("desc")
      .take(MAX_BOOKMARKS_PER_QUERY);

    // Fetch all bookmarks in parallel using Promise.all (removes N+1 query pattern)
    const bookmarkLists = await Promise.all(
      groups.map((group) => fetchGroupBookmarks(ctx, group._id)),
    );

    const allBookmarks = bookmarkLists.flat().map((bookmark) => ({
      _id: bookmark._id,
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      doneReading: bookmark.doneReading,
      createdAt: bookmark.createdAt,
      groupId: bookmark.groupId,
    }));

    return {
      groups,
      bookmarks: allBookmarks,
    };
  },
});

export const getBookmarksByGroupIds = query({
  args: { groupIds: v.array(v.id("groups")), userId: v.string() },
  handler: async (ctx, args) => {
    await requireUserId(args.userId);

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

      const groupBookmarks = await fetchGroupBookmarksByGroupId(ctx, groupId);
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
      .withIndex("by_userProvidedId_and_isPublic", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .take(MAX_BOOKMARKS_PER_QUERY);

    const counts: Record<string, number> = {};
    for (const group of groups) {
      const groupBookmarks = await fetchGroupBookmarksByGroupId(ctx, group._id);
      counts[group._id] = groupBookmarks.length;
    }
    return counts;
  },
});

export const getAllUserBookmarks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userProvidedId_and_isPublic", (q) =>
        q.eq("userProvidedId", args.userId),
      )
      .take(MAX_BOOKMARKS_PER_QUERY);

    const groupBookmarks = await Promise.all(
      groups.map(async (group) => {
        const bookmarks = await fetchGroupBookmarksByGroupId(ctx, group._id);

        return bookmarks.map((bookmark) => ({
          _id: bookmark._id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          imageUrl: bookmark.imageUrl,
          doneReading: bookmark.doneReading,
          createdAt: bookmark.createdAt,
          groupId: group._id,
          groupTitle: group.title,
        }));
      }),
    );

    return groupBookmarks.flat();
  },
});

/** Build public bookmark list for a given set of groups */
async function buildPublicBookmarkList(
  ctx: GenericQueryCtx<DataModel>,
  groups: Array<{ _id: Id<"groups">; title: string; color: string }>,
) {
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
    const groupBookmarks = await fetchGroupBookmarksByGroupId(ctx, group._id);

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
}

export const getPublicBookmarksByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return [];
    }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!profile || !profile.isPublic) {
      return [];
    }

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userProvidedId_and_isPublic", (q) =>
        q.eq("userProvidedId", profile.userProvidedId).eq("isPublic", true),
      )
      .take(MAX_BOOKMARKS_PER_QUERY);

    return await buildPublicBookmarkList(ctx, groups);
  },
});

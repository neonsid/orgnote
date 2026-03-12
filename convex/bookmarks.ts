import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { GenericQueryCtx } from "convex/server";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import {
  isValidUrl,
  verifyBookmarkOwnership,
  verifyGroupOwnership,
  fetchGroupBookmarks,
  fetchGroupBookmarksByGroupId,
  MAX_BOOKMARKS_PER_QUERY,
} from "./bookmark_helpers";
import { classifyUrl, parseGitHubRepo } from "./lib/url_classifier";

import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// ──────────────────────────────────────────────
// Internal Mutations
// ──────────────────────────────────────────────

export const insertBookmarkInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    groupId: v.id("groups"),
    imageUrl: v.string(),
    doneReading: v.boolean(),
    createdAt: v.number(),
  },
  returns: v.id("bookmarks"),
  handler: async (ctx, args): Promise<Id<"bookmarks">> => {
    return await ctx.db.insert("bookmarks", {
      title: args.title,
      description: args.description,
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: args.doneReading,
      createdAt: args.createdAt,
    });
  },
});

export const getGroupForInsert = internalQuery({
  args: { groupId: v.id("groups") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      title: v.string(),
      color: v.string(),
      userId: v.string(),
      isPublic: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;
    return group;
  },
});

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
  },
  returns: v.id("bookmarks"),
  handler: async (ctx, args): Promise<Id<"bookmarks">> => {
    const userId = await requireAuth(ctx);

    if (!args.groupId) {
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "GroupId not found",
      });
    }

    if (!isValidUrl(args.url)) {
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "Invalid URL format",
      });
    }

    await verifyGroupOwnership(ctx, args.groupId, userId);

    const currentTime = Date.now();
    let finalTitle = args.title;
    let finalDescription = args.description || "";

    // For GitHub URLs, fetch metadata synchronously (fast)
    const urlType = classifyUrl(args.url);
    if (urlType === "github" && !args.description) {
      const repoInfo = parseGitHubRepo(args.url);
      if (repoInfo) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Orgnote-Bookmark-Manager",
              },
            },
          );
          if (response.ok) {
            const data = await response.json();
            finalTitle = data.name || args.title;
            finalDescription = data.description || "";
          }
        } catch (error) {
          console.error("Failed to fetch GitHub repo info:", error);
        }
      }
    }

    const bookmarkId = await ctx.db.insert("bookmarks", {
      title: finalTitle,
      description: finalDescription,
      groupId: args.groupId,
      url: args.url,
      imageUrl: args.imageUrl,
      doneReading: false,
      createdAt: currentTime,
    });

    // For non-GitHub URLs, generate description in background via AI
    if (!args.description && urlType !== "github") {
      await ctx.scheduler.runAfter(
        0,
        internal.bookmarks.generateAndUpdateMetadata,
        {
          bookmarkId,
          url: args.url,
          userId,
        },
      );
    }

    return bookmarkId;
  },
});

export const generateAndUpdateMetadata = internalAction({
  args: {
    bookmarkId: v.id("bookmarks"),
    url: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const metadataResult = await ctx.runAction(
        api.metadata.generateBookmarkDescription,
        { url: args.url, userId: args.userId },
      );

      if (metadataResult.success) {
        const updateData: {
          title?: string;
          description?: string;
          imageUrl?: string;
        } = {};

        if (metadataResult.title) {
          updateData.title = metadataResult.title;
        }
        if (metadataResult.description) {
          updateData.description = metadataResult.description;
        }
        if (metadataResult.imageUrl) {
          updateData.imageUrl = metadataResult.imageUrl;
        }

        if (Object.keys(updateData).length > 0) {
          await ctx.runMutation(internal.bookmarks.updateBookmarkMetadata, {
            bookmarkId: args.bookmarkId,
            ...updateData,
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate metadata:", error);
    }
  },
});

export const updateBookmarkMetadata = internalMutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: {
      title?: string;
      description?: string;
      imageUrl?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title;
    }
    if (args.description !== undefined) {
      updateData.description = args.description;
    }
    if (args.imageUrl !== undefined) {
      updateData.imageUrl = args.imageUrl;
    }

    await ctx.db.patch(args.bookmarkId, updateData);
  },
});

export const deleteBookMark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  returns: v.object({ success: v.boolean(), deletedId: v.id("bookmarks") }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId);

    await ctx.db.delete(args.bookmarkId);
    return { success: true, deletedId: args.bookmarkId };
  },
});

export const renameBookMark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId);

    await ctx.db.patch(args.bookmarkId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const markAsDone = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId);

    await ctx.db.patch(args.bookmarkId, {
      doneReading: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const toggleReadStatus = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  returns: v.object({ success: v.boolean(), doneReading: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Bookmark not found",
      });
    }

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId);

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
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await Promise.all([
      verifyBookmarkOwnership(ctx, args.bookmarkId, userId),
      verifyGroupOwnership(ctx, args.groupId, userId),
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
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await verifyBookmarkOwnership(ctx, args.bookmarkId, userId);

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
        throw new ConvexError({
          code: "INVALID_ARGS",
          message: "Invalid URL format",
        });
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
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await verifyGroupOwnership(ctx, args.groupId, userId);

    return await fetchGroupBookmarks(ctx, args.groupId);
  },
});

export const listBookmarksMinimal = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await verifyGroupOwnership(ctx, args.groupId, userId);

    const bookmarks = await fetchGroupBookmarks(ctx, args.groupId);

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

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userId_and_isPublic", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_BOOKMARKS_PER_QUERY);

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
  args: { groupIds: v.array(v.id("groups")) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

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
      await verifyGroupOwnership(ctx, groupId, userId);

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
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userId_and_isPublic", (q) => q.eq("userId", userId))
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
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_userId_and_isPublic", (q) => q.eq("userId", userId))
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
      .withIndex("by_userId_and_isPublic", (q) =>
        q.eq("userId", profile.userId).eq("isPublic", true),
      )
      .take(MAX_BOOKMARKS_PER_QUERY);

    return await buildPublicBookmarkList(ctx, groups);
  },
});

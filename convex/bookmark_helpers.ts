import { ConvexError } from "convex/values";
import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel, Id } from "./_generated/dataModel";

const MAX_URL_LENGTH = 2000;
const ALLOWED_URL_PROTOCOLS = ["http:", "https:"];

/** Maximum number of bookmarks to return in any single query */
export const MAX_BOOKMARKS_PER_QUERY = 500;

export function isValidUrl(url: string): boolean {
    if (!url || url.length > MAX_URL_LENGTH) return false;
    try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        return ALLOWED_URL_PROTOCOLS.includes(parsed.protocol);
    } catch {
        return false;
    }
}

export async function requireUserId(userId: string): Promise<void> {
    if (!userId) {
        throw new ConvexError({ code: "UNAUTHORIZED", message: "UserId is required" });
    }
}

export async function verifyBookmarkOwnership(
    ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
    bookmarkId: Id<"bookmarks">,
    userId: string,
): Promise<void> {
    const bookmark = await ctx.db.get(bookmarkId);
    if (!bookmark) {
        throw new ConvexError({ code: "NOT_FOUND", message: "Bookmark not found" });
    }

    const group = await ctx.db.get(bookmark.groupId);
    if (!group) {
        throw new ConvexError({ code: "NOT_FOUND", message: "Group not found" });
    }

    if (group.userProvidedId !== userId) {
        throw new ConvexError({ code: "FORBIDDEN", message: "You don't own this bookmark" });
    }
}

export async function verifyGroupOwnership(
    ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
    groupId: Id<"groups">,
    userId: string,
): Promise<void> {
    const group = await ctx.db.get(groupId);
    if (!group) {
        throw new ConvexError({ code: "NOT_FOUND", message: "Group not found" });
    }
    if (group.userProvidedId !== userId) {
        throw new ConvexError({ code: "FORBIDDEN", message: "You don't own this group" });
    }
}

/** Fetch bookmarks for a group with proper ordering and limits */
export async function fetchGroupBookmarks(
    ctx: GenericQueryCtx<DataModel>,
    groupId: Id<"groups">,
    limit: number = MAX_BOOKMARKS_PER_QUERY,
) {
    return await ctx.db
        .query("bookmarks")
        .withIndex("by_groupId_and_createdAt", (q) => q.eq("groupId", groupId))
        .order("desc")
        .take(limit);
}

/** Fetch bookmarks for a group (unordered, by groupId index) */
export async function fetchGroupBookmarksByGroupId(
    ctx: GenericQueryCtx<DataModel>,
    groupId: Id<"groups">,
    limit: number = MAX_BOOKMARKS_PER_QUERY,
) {
    return await ctx.db
        .query("bookmarks")
        .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
        .take(limit);
}

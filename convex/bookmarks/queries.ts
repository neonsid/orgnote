import { v } from 'convex/values'
import { GenericQueryCtx, paginationOptsValidator } from 'convex/server'
import { query } from '../_generated/server'
import { DataModel, Id } from '../_generated/dataModel'
import { authQuery } from '../lib/auth'
import {
  verifyGroupOwnership,
  fetchGroupBookmarksByGroupId,
  fetchGroupBookmarks,
  bookmarkIsVisibleOnPublicListing,
} from './helpers'

import { MAX_GROUPS_PER_QUERY } from '../lib/constants'

async function buildPublicBookmarkList(
  ctx: GenericQueryCtx<DataModel>,
  groups: Array<{ _id: Id<'groups'>; title: string; color: string }>
) {
  const bookmarks: {
    _id: string
    title: string
    url: string
    description?: string
    imageUrl: string
    doneReading: boolean
    _creationTime: number
    groupId: string
    groupTitle: string
    groupColor: string
  }[] = []

  for (const group of groups) {
    const groupBookmarks = await fetchGroupBookmarks(ctx, group._id)

    for (const bookmark of groupBookmarks) {
      if (!bookmarkIsVisibleOnPublicListing(bookmark)) continue
      bookmarks.push({
        _id: bookmark._id,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        imageUrl: bookmark.imageUrl,
        doneReading: bookmark.doneReading,
        _creationTime: bookmark._creationTime,
        groupId: group._id,
        groupTitle: group.title,
        groupColor: group.color,
      })
    }
  }

  bookmarks.sort((a, b) => b._creationTime - a._creationTime)
  return bookmarks
}

export const listBookMarks = authQuery({
  args: { groupId: v.id('groups') },
  handler: async (ctx, args) => {
    const { userId } = ctx

    await verifyGroupOwnership(ctx, args.groupId, userId)

    return await fetchGroupBookmarks(ctx, args.groupId)
  },
})

export const listBookmarksMinimal = authQuery({
  args: { groupId: v.id('groups') },
  handler: async (ctx, args) => {
    const { userId } = ctx

    await verifyGroupOwnership(ctx, args.groupId, userId)

    const bookmarks = await fetchGroupBookmarks(ctx, args.groupId)

    return bookmarks.map((b) => ({
      _id: b._id,
      title: b.title,
      url: b.url,
      doneReading: b.doneReading,
      _creationTime: b._creationTime,
      groupId: b.groupId,
    }))
  },
})

/** Dashboard infinite scroll — one page of bookmarks for a single group. */
export const listBookmarksForGroupPaginated = authQuery({
  args: {
    groupId: v.id('groups'),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = ctx

    await verifyGroupOwnership(ctx, args.groupId, userId)

    const page = await ctx.db
      .query('bookmarks')
      .withIndex('by_groupId', (q) => q.eq('groupId', args.groupId))
      .order('desc')
      .paginate(args.paginationOpts)

    return {
      ...page,
      page: page.page.map((bookmark) => ({
        _id: bookmark._id,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        doneReading: bookmark.doneReading,
        _creationTime: bookmark._creationTime,
        groupId: bookmark.groupId,
        publicListingBlockedForUrlSafety:
          bookmark.publicListingBlockedForUrlSafety,
      })),
    }
  },
})

/**
 * Minimal rows for import duplicate detection (same per-group cap as legacy dashboard fetch).
 */
export const getBookmarkUrlKeysForImport = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) => q.eq('userId', userId))
      .order('desc')
      .take(MAX_GROUPS_PER_QUERY)

    const out: { groupId: Id<'groups'>; url: string }[] = []

    for (const group of groups) {
      const bookmarks = await fetchGroupBookmarks(ctx, group._id)
      for (const b of bookmarks) {
        out.push({ groupId: b.groupId, url: b.url })
      }
    }

    return out
  },
})

export const getBookmarksByGroupIds = authQuery({
  args: { groupIds: v.array(v.id('groups')) },
  handler: async (ctx, args) => {
    const { userId } = ctx

    const bookmarks: Array<{
      _id: string
      _creationTime: number
      title: string
      description?: string
      url: string
      imageUrl: string
      doneReading: boolean
      updatedAt?: number
      groupId: string
      groupTitle: string
    }> = []

    for (const groupId of args.groupIds) {
      await verifyGroupOwnership(ctx, groupId, userId)

      const groupBookmarks = await fetchGroupBookmarks(ctx, groupId)
      const group = await ctx.db.get(groupId)
      for (const bookmark of groupBookmarks) {
        bookmarks.push({
          ...bookmark,
          groupTitle: group?.title || 'Unknown',
        })
      }
    }
    return bookmarks
  },
})

export const getBookmarkCountsByUser = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) => q.eq('userId', userId))
      .take(MAX_GROUPS_PER_QUERY)

    const counts: Record<string, number> = {}
    for (const group of groups) {
      const groupBookmarks = await fetchGroupBookmarksByGroupId(ctx, group._id)
      counts[group._id] = groupBookmarks.length
    }
    return counts
  },
})

export const getAllUserBookmarks = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) => q.eq('userId', userId))
      .take(MAX_GROUPS_PER_QUERY)

    const groupBookmarks = await Promise.all(
      groups.map(async (group) => {
        const bookmarks = await fetchGroupBookmarks(ctx, group._id)

        return bookmarks.map((bookmark) => ({
          _id: bookmark._id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          imageUrl: bookmark.imageUrl,
          doneReading: bookmark.doneReading,
          _creationTime: bookmark._creationTime,
          groupId: group._id,
          groupTitle: group.title,
        }))
      })
    )

    return groupBookmarks.flat()
  },
})

export const getPublicBookmarksByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return []
    }

    const profile = await ctx.db
      .query('userProfile')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique()

    if (!profile || !profile.isPublic) {
      return []
    }

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) =>
        q.eq('userId', profile.userId).eq('isPublic', true)
      )
      .take(MAX_GROUPS_PER_QUERY)

    return await buildPublicBookmarkList(ctx, groups)
  },
})

export const getBookmarkDescriptionJob = authQuery({
  args: { jobId: v.id('bookmarkDescriptionJobs') },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('bookmarkDescriptionJobs'),
      _creationTime: v.number(),
      ownerId: v.string(),
      url: v.string(),
      status: v.union(
        v.literal('pending'),
        v.literal('complete'),
        v.literal('cancelled')
      ),
      success: v.optional(v.boolean()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      error: v.optional(v.string()),
      remainingSciraQuota: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const { userId } = ctx
    const job = await ctx.db.get(args.jobId)
    if (!job || job.ownerId !== userId) {
      return null
    }
    return job
  },
})

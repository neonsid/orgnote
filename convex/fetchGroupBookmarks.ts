import { GenericQueryCtx } from 'convex/server'
import { DataModel, Id } from './_generated/dataModel'
import { MAX_BOOKMARKS_PER_QUERY } from './lib/constants'

/** Fetch bookmarks for a group with proper ordering and limits */

export async function fetchGroupBookmarks(
  ctx: GenericQueryCtx<DataModel>,
  groupId: Id<'groups'>,
  limit: number = MAX_BOOKMARKS_PER_QUERY
) {
  return await ctx.db
    .query('bookmarks')
    .withIndex('by_groupId_and_createdAt', (q) => q.eq('groupId', groupId))
    .order('desc')
    .take(limit)
}

import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

/**
 * One-time migration: strip legacy `createdAt` from documents.
 *
 * If schema rejects rows with extra `createdAt`, temporarily add
 * `createdAt: v.optional(v.number())` to the affected tables, push, run:
 *   pnpm exec convex run migrations:removeStoredCreatedAt
 * then remove the optional fields from schema again and push.
 */
export const removeStoredCreatedAt = internalMutation({
  args: {},
  returns: v.object({
    groupsUpdated: v.number(),
    bookmarksUpdated: v.number(),
    vaultFilesUpdated: v.number(),
    vaultGroupsUpdated: v.number(),
  }),
  handler: async (ctx) => {
    let groupsUpdated = 0
    let bookmarksUpdated = 0
    let vaultFilesUpdated = 0
    let vaultGroupsUpdated = 0

    const gDocs = await ctx.db.query('groups').collect()
    for (const doc of gDocs) {
      const d = doc as Doc<'groups'> & { createdAt?: number }
      if (!('createdAt' in d) || d.createdAt === undefined) continue
      const { createdAt, ...rest } = d
      void createdAt
      await ctx.db.replace(doc._id as Id<'groups'>, rest as Doc<'groups'>)
      groupsUpdated++
    }

    const bDocs = await ctx.db.query('bookmarks').collect()
    for (const doc of bDocs) {
      const d = doc as Doc<'bookmarks'> & { createdAt?: number }
      if (!('createdAt' in d) || d.createdAt === undefined) continue
      const { createdAt, ...rest } = d
      void createdAt
      await ctx.db.replace(doc._id as Id<'bookmarks'>, rest as Doc<'bookmarks'>)
      bookmarksUpdated++
    }

    const vfDocs = await ctx.db.query('vaultFiles').collect()
    for (const doc of vfDocs) {
      const d = doc as Doc<'vaultFiles'> & { createdAt?: number }
      if (!('createdAt' in d) || d.createdAt === undefined) continue
      const { createdAt, ...rest } = d
      void createdAt
      await ctx.db.replace(doc._id as Id<'vaultFiles'>, rest as Doc<'vaultFiles'>)
      vaultFilesUpdated++
    }

    const vgDocs = await ctx.db.query('vaultGroups').collect()
    for (const doc of vgDocs) {
      const d = doc as Doc<'vaultGroups'> & { createdAt?: number }
      if (!('createdAt' in d) || d.createdAt === undefined) continue
      const { createdAt, ...rest } = d
      void createdAt
      await ctx.db.replace(doc._id as Id<'vaultGroups'>, rest as Doc<'vaultGroups'>)
      vaultGroupsUpdated++
    }

    return {
      groupsUpdated,
      bookmarksUpdated,
      vaultFilesUpdated,
      vaultGroupsUpdated,
    }
  },
})

import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

/**
 * One-time migration: strip legacy `createdAt` from documents (Convex already
 * exposes `_creationTime`).
 *
 * This is an **internal** mutation: the CLI must use the `internal.*` path.
 * `convex run` targets your **dev** deployment by default; production needs
 * `--prod` (after `convex deploy`), or you will migrate dev only while prod
 * still has stale rows and the next prod push fails schema validation.
 *
 * 1. Ensure schema includes `createdAt: v.optional(v.number())` on affected
 *    tables so deploy succeeds (see convex/schema.ts).
 * 2. Deploy, then run:
 *      pnpm exec convex run internal.migrations.removeStoredCreatedAt
 *    For production:
 *      pnpm exec convex run internal.migrations.removeStoredCreatedAt --prod
 * 3. Remove the optional `createdAt` fields from schema and deploy again.
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

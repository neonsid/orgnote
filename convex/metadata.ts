'use node'

/**
 * Convex registers this file as the `metadata` API module (`api.metadata.*`).
 * Shared implementation lives in `./metadata/*.ts` next to `./metadata/internal.ts`.
 */
import { action, internalAction } from './_generated/server'
import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { internal } from './_generated/api'
import { isFigmaUrl } from './lib/url_classifier'
import { bookmarkDescriptionReturnsValidator } from './metadata/validators'
import { fetchGitHubRepoTitle } from './metadata/github_fetch'
import { runBookmarkDescriptionFlow } from './metadata/bookmark_description'

export const fetchGitHubRepoInfoInternal = internalAction({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  returns: v.object({
    name: v.string(),
    description: v.optional(v.string()),
  }),
  handler: async (_, args) => {
    const result = await fetchGitHubRepoTitle(args.owner, args.repo)
    return {
      name: result.name,
      description: result.description ?? undefined,
    }
  },
})

export const updateBookmarkGitHubMetadata = internalAction({
  args: {
    bookmarkId: v.id('bookmarks'),
    owner: v.string(),
    repo: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const repoMeta = await fetchGitHubRepoTitle(args.owner, args.repo)

      await ctx.runMutation(
        internal.bookmarks.internal.updateBookmarkInternal,
        {
          bookmarkId: args.bookmarkId,
          title: repoMeta.name,
          description: repoMeta.description ?? '',
        }
      )
    } catch (error) {
      console.error('Failed to update bookmark GitHub metadata:', error)
    }
  },
})

export const generateBookmarkDescription = action({
  args: {
    url: v.string(),
    userId: v.optional(v.string()),
  },
  returns: bookmarkDescriptionReturnsValidator,
  handler: async (ctx, args) => {
    let userId = args.userId
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) {
        throw new ConvexError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        })
      }
      userId = identity.subject
    }

    // Non-HTML/file URLs (PDF, media, archives): create/import skips scheduling auto metadata
    // (see scheduleBookmarkMetadata). If this action still runs, the generic branch uses
    // open-graph-scraper, which rejects non-HTML URLs → null, generic 'could not fetch' error, no LLM.

    if (isFigmaUrl(args.url)) {
      return {
        success: false,
        error:
          'Figma blocks automated fetching, so no AI summary is generated. You can add a description manually.',
      }
    }

    return runBookmarkDescriptionFlow(ctx, { url: args.url, userId })
  },
})

'use node'

/**
 * Convex registers this file as the `metadata` API module (`api.metadata.*`).
 * Shared implementation lives in `./metadata/*.ts` next to `./metadata/internal.ts`.
 */
import { internalAction } from './_generated/server'
import { v } from 'convex/values'
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

/** Used by `bookmarks/internal.generateAndUpdateMetadata` — prefer helpers over chaining public actions. */
export const executeBookmarkDescription = internalAction({
  args: {
    url: v.string(),
    userId: v.string(),
  },
  returns: bookmarkDescriptionReturnsValidator,
  handler: async (ctx, args) => {
    if (isFigmaUrl(args.url)) {
      return {
        success: false,
        error:
          'Figma blocks automated fetching, so no AI summary is generated. You can add a description manually.',
      }
    }

    return runBookmarkDescriptionFlow(ctx, { url: args.url, userId: args.userId })
  },
})

/** Scheduled by `bookmarks/mutations.requestBookmarkDescription` (client uses mutation + query, not useAction). */
export const processBookmarkDescriptionJob = internalAction({
  args: { jobId: v.id('bookmarkDescriptionJobs') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(
      internal.metadata.internal.getBookmarkDescriptionJobRow,
      { jobId: args.jobId }
    )
    if (!job || job.status !== 'pending') {
      return null
    }

    try {
      if (isFigmaUrl(job.url)) {
        await ctx.runMutation(
          internal.metadata.internal.finalizeBookmarkDescriptionJob,
          {
            jobId: args.jobId,
            result: {
              success: false,
              error:
                'Figma blocks automated fetching, so no AI summary is generated. You can add a description manually.',
            },
          }
        )
        return null
      }

      const result = await runBookmarkDescriptionFlow(ctx, {
        url: job.url,
        userId: job.ownerId,
      })

      await ctx.runMutation(
        internal.metadata.internal.finalizeBookmarkDescriptionJob,
        {
          jobId: args.jobId,
          result,
        }
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate description'
      await ctx.runMutation(
        internal.metadata.internal.finalizeBookmarkDescriptionJob,
        {
          jobId: args.jobId,
          result: {
            success: false,
            error: message,
          },
        }
      )
    }

    return null
  },
})

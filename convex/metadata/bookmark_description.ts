'use node'

import type { ActionCtx } from '../_generated/server'
import { internal } from '../_generated/api'
import {
  classifyUrl,
  extractTwitterHandleFromUrl,
  parseGitHubRepo,
  parseYouTubeVideoId,
} from '../lib/url_classifier'
import { fetchTweetContentWithScira, getSciraApiKey } from '../lib/scira'
import { generateDescriptionWithAI } from './ai_description'
import type { BookmarkDescriptionReturn } from './validators'
import { fetchGitHubReadme, fetchGitHubRepoTitle } from './github_fetch'
import { fetchOpenGraphMetadata } from './open_graph'
import {
  fetchYouTubeOEmbedWithCanonicalFallback,
  fetchYouTubeVideoSnippet,
  getYouTubeApiKey,
} from './youtube_fetch'

/**
 * Core URL-type branching and LLM step for bookmark description (internal actions).
 * Caller resolves auth and Figma before invoking.
 */
export async function runBookmarkDescriptionFlow(
  ctx: ActionCtx,
  args: { url: string; userId: string }
): Promise<BookmarkDescriptionReturn> {
  const { url, userId } = args

  try {
    const urlType = classifyUrl(url)

    let title: string | undefined
    /** Set by each URL-type branch before `generateDescriptionWithAI`. */
    let content!: string
    let imageUrl: string | undefined
    let remainingQuota: number | undefined

    if (urlType === 'twitter') {
      const today = new Date().toISOString().split('T')[0]
      const quotaResult = await ctx.runQuery(
        internal.metadata.internal.checkSciraQuotaInternal,
        {
          userId,
          today,
        }
      )

      remainingQuota = quotaResult.remaining

      if (!quotaResult.hasQuota) {
        return {
          success: false,
          error: `Daily X/Twitter limit reached (20/day). Enter description manually or try again tomorrow.`,
          remainingSciraQuota: 0,
        }
      }

      const sciraKey = getSciraApiKey()
      const openRouterKey = process.env.OPENROUTER_API_KEY

      if (!sciraKey) {
        return {
          success: false,
          error: 'Scira API not configured. Enter description manually.',
        }
      }

      if (!openRouterKey) {
        return {
          success: false,
          error: 'OpenRouter API not configured. Enter description manually.',
        }
      }

      const tweetData = await fetchTweetContentWithScira(
        url,
        sciraKey,
        openRouterKey
      )

      if (!tweetData) {
        return {
          success: false,
          error: 'Could not fetch tweet content. Enter description manually.',
          remainingSciraQuota: remainingQuota,
        }
      }

      await ctx.runMutation(
        internal.metadata.internal.incrementSciraQuotaInternal,
        {
          userId,
          usageId: quotaResult.usageId,
        }
      )

      const handleFromUrl = extractTwitterHandleFromUrl(url)
      const authorLabel = tweetData.author?.trim()
      title = authorLabel
        ? `Tweet by ${authorLabel}`
        : handleFromUrl
          ? `Tweet by @${handleFromUrl}`
          : 'Post on X'
      content = tweetData.content
      imageUrl = tweetData.urls[0]
    } else if (urlType === 'github') {
      const repoInfo = parseGitHubRepo(url)
      if (!repoInfo) {
        return {
          success: false,
          error: 'Invalid GitHub URL. Enter description manually.',
        }
      }

      const repoMeta = await fetchGitHubRepoTitle(repoInfo.owner, repoInfo.repo)
      title = repoMeta.name

      const readme = await fetchGitHubReadme(repoInfo.owner, repoInfo.repo)

      if (!readme) {
        content = repoMeta.description
          ? `GitHub repository: ${title} — ${repoMeta.description}`
          : `GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`
      } else {
        content = readme
      }
    } else if (urlType === 'youtube') {
      const videoId = parseYouTubeVideoId(url)
      const ytKey = getYouTubeApiKey()

      let youtubeResolved = false

      if (videoId && ytKey) {
        const snippet = await fetchYouTubeVideoSnippet(videoId, ytKey)
        if (snippet) {
          title = snippet.title
          imageUrl = snippet.thumbnailUrl
          const parts: string[] = [`Title: ${snippet.title}`]
          if (snippet.channelTitle) {
            parts.push(`Channel: ${snippet.channelTitle}`)
          }
          if (snippet.description) {
            parts.push(`Description: ${snippet.description}`)
          }
          content = parts.join('\n')
          youtubeResolved = true
        }
      }

      if (!youtubeResolved) {
        const oembed = await fetchYouTubeOEmbedWithCanonicalFallback(url, videoId)
        if (oembed) {
          title = oembed.title
          imageUrl = oembed.thumbnailUrl ?? imageUrl
          const parts: string[] = [`Title: ${oembed.title}`]
          if (oembed.authorName) {
            parts.push(`Channel: ${oembed.authorName}`)
          }
          content = parts.join('\n')
          youtubeResolved = true
        }
      }

      if (!youtubeResolved) {
        return {
          success: false,
          error:
            'Could not load this video from YouTube (Data API and oEmbed). Add a title and description manually, or try again later.',
        }
      }
    } else {
      const ogData = await fetchOpenGraphMetadata(url)

      if (!ogData) {
        return {
          success: false,
          error: 'Could not fetch page content. Enter description manually.',
        }
      }

      title = ogData.title
      content = ogData.content
    }

    const description = await generateDescriptionWithAI(url, title, content)

    return {
      success: true,
      title,
      description,
      imageUrl,
      remainingSciraQuota: remainingQuota,
    }
  } catch (error) {
    console.error('Error generating description:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate description. Try again or enter manually.',
    }
  }
}

'use node'
import { action, type ActionCtx } from './_generated/server'
import { v, type Infer } from 'convex/values'
import { internal } from './_generated/api'
import { classifyUrl, parseGitHubRepo } from './lib/url_classifier'
import { fetchTweetContentWithScira, getSciraApiKey } from './lib/scira'

// OpenRouter integration
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

// Type for the return value
const returnsValidator = v.object({
  success: v.boolean(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  error: v.optional(v.string()),
  remainingSciraQuota: v.optional(v.number()),
})

type ReturnType = Infer<typeof returnsValidator>

const MAX_GITHUB_README_LENGTH = 3000
const MAX_DESCRIPTION_LENGTH = 150

/**
 * Fetch GitHub README content
 */
async function fetchGitHubReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    // Try HEAD first
    let url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`
    let response = await fetch(url)

    if (!response.ok) {
      // Try lowercase variant
      url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/readme.md`
      response = await fetch(url)
    }

    if (!response.ok) {
      return null
    }

    const text = await response.text()
    // Truncate if too long
    return text.length > MAX_GITHUB_README_LENGTH
      ? text.slice(0, MAX_GITHUB_README_LENGTH) + '...'
      : text
  } catch (error) {
    console.error('Failed to fetch README:', error)
    return null
  }
}

/**
 * Fetch Open Graph metadata from a generic URL
 */
async function fetchOpenGraphMetadata(
  url: string
): Promise<{ title?: string; description?: string; content: string } | null> {
  try {
    // Dynamic import to avoid issues with ESM/CJS
    const { default: ogs } = await import('open-graph-scraper')

    const { result } = await ogs({ url })

    const title = result.ogTitle || result.twitterTitle || undefined
    const description =
      result.ogDescription || result.twitterDescription || undefined

    // Build content string from available metadata
    const contentParts: string[] = []
    if (title) contentParts.push(`Title: ${title}`)
    if (description) contentParts.push(`Description: ${description}`)
    if (result.ogSiteName) contentParts.push(`Site: ${result.ogSiteName}`)

    return {
      title,
      description,
      content: contentParts.join('\n') || url,
    }
  } catch (error) {
    console.error('Failed to fetch Open Graph metadata:', error)
    return null
  }
}

/**
 * Generate description using OpenRouter AI
 */
async function generateDescriptionWithAI(
  url: string,
  title: string | undefined,
  content: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  console.log('[OpenRouter] Starting description generation for:', url)
  console.log('[OpenRouter] Title:', title || '(none)')
  console.log('[OpenRouter] Content length:', content.length)

  try {
    const openrouter = createOpenRouter({
      apiKey,
    })

    const prompt = `You are a helpful assistant that creates concise bookmark descriptions.

URL: ${url}
${title ? `Title: ${title}` : ''}
Content: ${content}

Create a description of 10-20 words that summarizes what this link contains.
The description should help the user remember why they saved this bookmark.

Rules:
- 10-20 words maximum
- Clear and informative
- No marketing fluff
- Just the description, no quotes or prefixes

Description:`

    console.log(
      '[OpenRouter] Calling generateText with model: openai/gpt-oss-120b'
    )

    const { text, usage, finishReason } = await generateText({
      model: openrouter('openai/gpt-oss-120b'),
      prompt,
      temperature: 0.7,
    })

    console.log('[OpenRouter] Response received:')
    console.log('[OpenRouter] - Text:', text)
    console.log('[OpenRouter] - Usage:', JSON.stringify(usage))
    console.log('[OpenRouter] - Finish reason:', finishReason)

    // Clean up the response
    let description = text.trim()

    // Remove quotes if present
    description = description.replace(/^["']|["']$/g, '')

    // Truncate if too long
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      description = description.slice(0, MAX_DESCRIPTION_LENGTH)
    }

    console.log('[OpenRouter] Final description:', description)

    return description
  } catch (error) {
    console.error('[OpenRouter] Error in generateDescriptionWithAI:')
    console.error('[OpenRouter] Error type:', typeof error)
    console.error(
      '[OpenRouter] Error message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      '[OpenRouter] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    )
    throw error
  }
}

/**
 * Main action: Generate bookmark description
 * This is the entry point called from the frontend
 */
export const generateBookmarkDescription = action({
  args: {
    url: v.string(),
    userId: v.string(),
  },
  returns: returnsValidator,
  handler: async (ctx, args): Promise<ReturnType> => {
    try {
      const urlType = classifyUrl(args.url)

      // Fetch raw metadata based on URL type
      let title: string | undefined
      let content: string
      let imageUrl: string | undefined
      let remainingQuota: number | undefined

      if (urlType === 'twitter') {
        // Check Scira quota using internal query
        const quotaResult = await ctx.runQuery(
          internal.metadata_internal.checkSciraQuotaInternal,
          {
            userId: args.userId,
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

        // Fetch tweet content using Scira + OpenRouter
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
          args.url,
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

        // Increment quota after successful fetch
        await ctx.runMutation(
          internal.metadata_internal.incrementSciraQuotaInternal,
          {
            userId: args.userId,
            usageId: quotaResult.usageId,
          }
        )

        title = tweetData.author ? `Tweet by ${tweetData.author}` : undefined
        content = tweetData.content
        imageUrl = tweetData.urls[0] // Use first URL as image if available
      } else if (urlType === 'github') {
        const repoInfo = parseGitHubRepo(args.url)
        if (!repoInfo) {
          return {
            success: false,
            error: 'Invalid GitHub URL. Enter description manually.',
          }
        }

        const readme = await fetchGitHubReadme(repoInfo.owner, repoInfo.repo)

        if (!readme) {
          // Fallback to just the repo name
          title = `${repoInfo.owner}/${repoInfo.repo}`
          content = `GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`
        } else {
          title = `${repoInfo.owner}/${repoInfo.repo}`
          content = readme
        }
      } else {
        // Generic URL - use Open Graph
        const ogData = await fetchOpenGraphMetadata(args.url)

        if (!ogData) {
          return {
            success: false,
            error: 'Could not fetch page content. Enter description manually.',
          }
        }

        title = ogData.title
        content = ogData.content
      }

      // Generate description with AI
      const description = await generateDescriptionWithAI(
        args.url,
        title,
        content
      )

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
  },
})

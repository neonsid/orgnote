import { GenericMutationCtx } from 'convex/server'
import { DataModel } from '../_generated/dataModel'
import { extractTweetId } from './url_classifier'

const SKYRA_DAILY_LIMIT = 20

/**
 * Check if user has remaining Skyra quota for today
 */
export async function checkSkyraQuota(
  ctx: GenericMutationCtx<DataModel>,
  userProvidedId: string
): Promise<{ hasQuota: boolean; remaining: number; currentCount: number }> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const usage = await ctx.db
    .query('skyraUsage')
    .withIndex('by_user_date', (q) =>
      q.eq('userProvidedId', userProvidedId).eq('date', today)
    )
    .first()

  const currentCount = usage?.requestCount ?? 0
  const remaining = Math.max(0, SKYRA_DAILY_LIMIT - currentCount)

  return {
    hasQuota: remaining > 0,
    remaining,
    currentCount,
  }
}

/**
 * Increment Skyra usage counter for the user
 */
export async function incrementSkyraQuota(
  ctx: GenericMutationCtx<DataModel>,
  userProvidedId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const existing = await ctx.db
    .query('skyraUsage')
    .withIndex('by_user_date', (q) =>
      q.eq('userProvidedId', userProvidedId).eq('date', today)
    )
    .first()

  if (existing) {
    await ctx.db.patch(existing._id, {
      requestCount: existing.requestCount + 1,
    })
  } else {
    await ctx.db.insert('skyraUsage', {
      userProvidedId,
      date: today,
      requestCount: 1,
    })
  }
}

interface SkyraTweetResponse {
  data?: {
    text?: string
    author?: {
      name?: string
      username?: string
    }
    createdAt?: string
  }
  error?: string
}

/**
 * Fetch tweet content from Skyra API
 */
export async function fetchTweetContent(
  url: string,
  apiKey: string
): Promise<{
  content: string
  author?: string
  postedAt?: string
} | null> {
  const tweetId = extractTweetId(url)
  if (!tweetId) {
    return null
  }

  try {
    // Skyra API endpoint - this is a placeholder, replace with actual endpoint
    const response = await fetch(
      `https://api.skyra.pw/twitter/tweets/${tweetId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Skyra API error:', response.status, await response.text())
      return null
    }

    const data: SkyraTweetResponse = await response.json()

    if (data.error || !data.data) {
      return null
    }

    const tweet = data.data
    const content = tweet.text || ''
    const author = tweet.author?.username || tweet.author?.name
    const postedAt = tweet.createdAt

    return {
      content,
      author,
      postedAt,
    }
  } catch (error) {
    console.error('Failed to fetch tweet:', error)
    return null
  }
}

/**
 * Get the Skyra API key from environment
 */
export function getSkyraApiKey(): string | null {
  return process.env.SKYRA_API_KEY || null
}

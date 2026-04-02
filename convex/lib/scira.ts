import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { extractTweetId } from './url_classifier'
import { GenericMutationCtx } from 'convex/server'
import { DataModel } from '../_generated/dataModel'
import {
  OPENROUTER_GENERATE_TEXT_TIMEOUT_MS,
  SCIRA_API_URL,
  SCIRA_DAILY_LIMIT,
  SCIRA_FETCH_TIMEOUT_MS,
} from './constants'
import { CLEANUP_SYSTEM_PROMPT } from './prompt'

interface SciraResponse {
  text?: string
  sources?: string[]
}

interface ParsedTweetData {
  summary: string
  keyPoints: string[]
  urls: string[]
  sources: string[]
  author?: string
}

/**
 * Get Scira API key from environment
 */
export function getSciraApiKey(): string | null {
  return process.env.SCIRA_API_KEY || null
}

/**
 * Fetch raw tweet data from Scira API
 */
async function fetchFromScira(
  tweetUrl: string,
  apiKey: string
): Promise<SciraResponse | null> {
  try {
    const response = await fetch(SCIRA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `Extract summary, key points, and all URLs from this tweet: ${tweetUrl}`,
      }),
      signal: AbortSignal.timeout(SCIRA_FETCH_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error('Scira API error:', response.status, await response.text())
      return null
    }

    const data = await response.json()

    // Handle Scira's nested response structure
    if (data.text && typeof data.text === 'string') {
      // Scira returns { text: "{ \"text\": \"...\", \"sources\": [...] }", sources: [...] }
      try {
        const innerData = JSON.parse(data.text)
        return {
          text: innerData.text || data.text,
          sources: data.sources || innerData.sources || [],
        }
      } catch {
        // If parsing fails, use raw text
        return {
          text: data.text,
          sources: data.sources || [],
        }
      }
    }

    return data
  } catch (error) {
    console.error('Failed to fetch from Scira:', error)
    return null
  }
}

/**
 * Clean Scira output using gpt-oss-120b via OpenRouter
 */
async function cleanWithOpenRouter(
  rawContent: string,
  apiKey: string
): Promise<ParsedTweetData | null> {
  console.log('[Scira/OpenRouter] Starting cleanup with OpenRouter')
  console.log('[Scira/OpenRouter] Raw content length:', rawContent.length)
  console.log(
    '[Scira/OpenRouter] Raw content preview:',
    rawContent.slice(0, 200)
  )

  try {
    const openrouter = createOpenRouter({ apiKey })
    console.log('[Scira/OpenRouter] OpenRouter client created')

    console.log(
      '[Scira/OpenRouter] Calling generateText with model: openai/gpt-oss-120b'
    )
    const { text, usage, finishReason } = await generateText({
      model: openrouter('openai/gpt-oss-120b'),
      system: CLEANUP_SYSTEM_PROMPT,
      prompt: `Clean up this tweet summary data:\n\n${rawContent}`,
      temperature: 0.3,
      maxRetries: 1,
      timeout: OPENROUTER_GENERATE_TEXT_TIMEOUT_MS,
    })

    console.log('[Scira/OpenRouter] Response received:')
    console.log('[Scira/OpenRouter] - Text:', text)
    console.log('[Scira/OpenRouter] - Usage:', JSON.stringify(usage))
    console.log('[Scira/OpenRouter] - Finish reason:', finishReason)

    // Extract JSON from response
    const jsonMatch =
      text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text

    console.log(
      '[Scira/OpenRouter] Extracted JSON string:',
      jsonStr.slice(0, 200)
    )

    const parsed = JSON.parse(jsonStr.trim())

    console.log(
      '[Scira/OpenRouter] Parsed result:',
      JSON.stringify(parsed, null, 2)
    )

    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      urls: parsed.urls || [],
      sources: parsed.sources || [],
      author: parsed.author,
    }
  } catch (error) {
    console.error('[Scira/OpenRouter] Error in cleanWithOpenRouter:')
    console.error('[Scira/OpenRouter] Error type:', typeof error)
    console.error(
      '[Scira/OpenRouter] Error message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      '[Scira/OpenRouter] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    )

    // Fallback: return raw content as summary
    console.log('[Scira/OpenRouter] Falling back to raw content')
    return {
      summary: rawContent.slice(0, 300).replace(/\n/g, ' '),
      keyPoints: [],
      urls: extractUrlsFromText(rawContent),
      sources: [],
    }
  }
}

/**
 * Extract URLs from text using regex
 */
function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s\"<>]+)/g
  const matches = text.match(urlRegex)
  return matches ? [...new Set(matches)] : []
}

/**
 * Fetch and parse tweet content using Scira + OpenRouter
 * This replaces the Skyra implementation
 */
export async function fetchTweetContentWithScira(
  tweetUrl: string,
  sciraApiKey: string,
  openRouterApiKey: string
): Promise<{
  content: string
  author?: string
  urls: string[]
  sources: string[]
} | null> {
  console.log('[Scira] Starting fetchTweetContentWithScira for:', tweetUrl)

  const tweetId = extractTweetId(tweetUrl)
  if (!tweetId) {
    console.error('[Scira] Failed to extract tweet ID from URL:', tweetUrl)
    return null
  }
  console.log('[Scira] Extracted tweet ID:', tweetId)

  // Step 1: Fetch from Scira
  console.log('[Scira] Step 1: Fetching from Scira API...')
  const sciraData = await fetchFromScira(tweetUrl, sciraApiKey)
  if (!sciraData || !sciraData.text) {
    console.error('[Scira] Failed to fetch from Scira or empty response')
    return null
  }
  console.log(
    '[Scira] Scira response received, text length:',
    sciraData.text.length
  )

  // Step 2: Clean up with OpenRouter
  console.log('[Scira] Step 2: Cleaning with OpenRouter...')
  const cleaned = await cleanWithOpenRouter(sciraData.text, openRouterApiKey)
  if (!cleaned) {
    console.error('[Scira] Failed to clean with OpenRouter')
    return null
  }
  console.log('[Scira] Cleaned result:', JSON.stringify(cleaned, null, 2))

  // Build content string
  const contentParts: string[] = [cleaned.summary]

  if (cleaned.keyPoints.length > 0) {
    contentParts.push('\nKey points:')
    cleaned.keyPoints.forEach((point) => contentParts.push(`- ${point}`))
  }

  const allUrls = [...new Set([...cleaned.urls, ...cleaned.sources])]

  const result = {
    content: contentParts.join('\n'),
    author: cleaned.author,
    urls: allUrls,
    sources:
      cleaned.sources.length > 0 ? cleaned.sources : sciraData.sources || [],
  }

  console.log('[Scira] Final result:', JSON.stringify(result, null, 2))
  return result
}

/**
 * Check if Scira is configured
 */
export function isSciraConfigured(): boolean {
  return !!getSciraApiKey()
}

/**
 * Check if user has remaining Scira quota for today
 */
export async function checkSciraQuota(
  ctx: GenericMutationCtx<DataModel>,
  userId: string
): Promise<{ hasQuota: boolean; remaining: number; currentCount: number }> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const usage = await ctx.db
    .query('sciraUsage')
    .withIndex('by_userId_and_date', (q) =>
      q.eq('userId', userId).eq('date', today)
    )
    .first()

  const currentCount = usage?.requestCount ?? 0
  const remaining = Math.max(0, SCIRA_DAILY_LIMIT - currentCount)

  return {
    hasQuota: remaining > 0,
    remaining,
    currentCount,
  }
}

/**
 * Increment Scira usage counter for the user
 */

export async function incrementSciraQuota(
  ctx: GenericMutationCtx<DataModel>,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const existing = await ctx.db
    .query('sciraUsage')
    .withIndex('by_userId_and_date', (q) =>
      q.eq('userId', userId).eq('date', today)
    )
    .first()

  if (existing) {
    await ctx.db.patch(existing._id, {
      requestCount: existing.requestCount + 1,
    })
  } else {
    await ctx.db.insert('sciraUsage', {
      userId,
      date: today,
      requestCount: 1,
    })
  }
}

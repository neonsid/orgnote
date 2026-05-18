'use node'

import { OPEN_GRAPH_FETCH_USER_AGENT } from '../lib/constants'

export type YouTubeSnippetMeta = {
  title: string
  description?: string
  channelTitle?: string
  thumbnailUrl?: string
}

export function getYouTubeApiKey(): string | undefined {
  const key = process.env.YOUTUBE_API_KEY?.trim()
  return key || undefined
}

export type YouTubeOEmbedMeta = {
  title: string
  thumbnailUrl?: string
  authorName?: string
}

/**
 * Official YouTube oEmbed (no API key). Prefer over Open Graph — OG often resolves to site name only.
 */
export async function fetchYouTubeOEmbed(
  pageUrl: string
): Promise<YouTubeOEmbedMeta | null> {
  try {
    const endpoint = new URL('https://www.youtube.com/oembed')
    endpoint.searchParams.set('format', 'json')
    endpoint.searchParams.set('url', pageUrl)

    const response = await fetch(endpoint.toString(), {
      headers: {
        'User-Agent': OPEN_GRAPH_FETCH_USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`[YouTube] oEmbed HTTP ${response.status}`)
      return null
    }

    const data = (await response.json()) as {
      title?: string
      thumbnail_url?: string
      author_name?: string
    }

    const title = data.title?.trim()
    if (!title) {
      return null
    }

    const thumbnailUrl = data.thumbnail_url?.trim()
    const authorName = data.author_name?.trim()

    return {
      title,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(authorName ? { authorName } : {}),
    }
  } catch (error) {
    console.warn(
      '[YouTube] oEmbed threw:',
      error instanceof Error ? error.message : String(error)
    )
    return null
  }
}

export async function fetchYouTubeOEmbedWithCanonicalFallback(
  pageUrl: string,
  videoId: string | null
): Promise<YouTubeOEmbedMeta | null> {
  const primary = await fetchYouTubeOEmbed(pageUrl)
  if (primary) {
    return primary
  }
  if (!videoId) {
    return null
  }
  const canonical = `https://www.youtube.com/watch?v=${videoId}`
  return fetchYouTubeOEmbed(canonical)
}

/**
 * Video snippet from YouTube Data API v3 `videos.list` (public metadata).
 */
export async function fetchYouTubeVideoSnippet(
  videoId: string,
  apiKey: string
): Promise<YouTubeSnippetMeta | null> {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('id', videoId)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.warn(
        `[YouTube] videos.list HTTP ${response.status} for id=${videoId}`
      )
      return null
    }

    const data = (await response.json()) as {
      items?: Array<{
        snippet?: {
          title?: string
          description?: string
          channelTitle?: string
          thumbnails?: {
            high?: { url?: string }
            medium?: { url?: string }
            default?: { url?: string }
          }
        }
      }>
      error?: { message?: string; code?: number }
    }

    if (data.error?.message) {
      console.warn('[YouTube] API error:', data.error.message)
      return null
    }

    const snippet = data.items?.[0]?.snippet
    if (!snippet) {
      return null
    }

    const title = snippet.title?.trim()
    if (!title) {
      return null
    }

    const description = snippet.description?.trim()
    const channelTitle = snippet.channelTitle?.trim()

    const thumbnailUrl =
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url

    return {
      title,
      ...(description ? { description } : {}),
      ...(channelTitle ? { channelTitle } : {}),
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    }
  } catch (error) {
    console.warn(
      '[YouTube] fetch threw:',
      error instanceof Error ? error.message : String(error)
    )
    return null
  }
}

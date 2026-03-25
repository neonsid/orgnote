'use node'

import {
  OPEN_GRAPH_FETCH_ACCEPT_LANGUAGE,
  OPEN_GRAPH_FETCH_TIMEOUT_SECONDS,
  OPEN_GRAPH_FETCH_USER_AGENT,
  OPEN_GRAPH_MAX_REDIRECTIONS,
} from '../lib/constants'
import type { OpenGraphScraperOptions } from 'open-graph-scraper/types'

/**
 * Open Graph / Twitter card metadata for generic HTTP(S) URLs.
 */
export async function fetchOpenGraphMetadata(
  url: string
): Promise<{ title?: string; description?: string; content: string } | null> {
  try {
    const { default: ogs } = await import('open-graph-scraper')

    const fetchOptions = {
      maxRedirections: OPEN_GRAPH_MAX_REDIRECTIONS,
      headers: {
        'User-Agent': OPEN_GRAPH_FETCH_USER_AGENT,
        'Accept-Language': OPEN_GRAPH_FETCH_ACCEPT_LANGUAGE,
      },
    } as NonNullable<OpenGraphScraperOptions['fetchOptions']>

    const ogsResponse = await ogs({
      url,
      timeout: OPEN_GRAPH_FETCH_TIMEOUT_SECONDS,
      fetchOptions,
    })

    const { error: ogsFailed, result } = ogsResponse

    if (ogsFailed || result.success === false) {
      const errField = (result as { error?: string | Error }).error
      const detail =
        typeof errField === 'string'
          ? errField
          : errField instanceof Error
            ? errField.message
            : 'unknown error'
      console.warn(
        `[OpenGraph] fetch failed for ${url} (${detail}) — try manual description`
      )
      return null
    }

    const title = result.ogTitle || result.twitterTitle || undefined
    const description =
      result.ogDescription || result.twitterDescription || undefined

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
    console.warn(
      '[OpenGraph] fetch threw:',
      error instanceof Error ? error.message : String(error)
    )
    return null
  }
}

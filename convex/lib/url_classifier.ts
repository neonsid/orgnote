/**
 * URL classification utilities for determining the type of URL being processed
 */

import { twitterHosts } from './constants'

export type UrlType = 'github' | 'twitter' | 'youtube' | 'generic'

/** YouTube watch/embed hosts we resolve video IDs for (Data API / OG fallback). */
export function isYouTubeVideoHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return (
    h === 'youtube.com' ||
    h === 'www.youtube.com' ||
    h === 'm.youtube.com' ||
    h === 'music.youtube.com' ||
    h === 'youtu.be' ||
    h === 'www.youtu.be'
  )
}

/** Typical YouTube video IDs are 11 chars ([A-Za-z0-9_-]). */
function isLikelyYouTubeVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * Extract video ID from common YouTube URL shapes (watch, embed, shorts, live, youtu.be, Music).
 */
export function parseYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!isYouTubeVideoHost(parsed.hostname)) {
      return null
    }

    if (
      parsed.hostname === 'youtu.be' ||
      parsed.hostname === 'www.youtu.be'
    ) {
      const segment = parsed.pathname.split('/').filter(Boolean)[0]
      if (segment && isLikelyYouTubeVideoId(segment)) {
        return segment
      }
      return null
    }

    const vParam = parsed.searchParams.get('v')
    if (vParam && isLikelyYouTubeVideoId(vParam.trim())) {
      return vParam.trim()
    }

    const parts = parsed.pathname.split('/').filter(Boolean)
    const idxAfter = (segment: string): string | null => {
      const i = parts.indexOf(segment)
      const id = i !== -1 ? parts[i + 1] : undefined
      return id && isLikelyYouTubeVideoId(id) ? id : null
    }

    const fromEmbed = idxAfter('embed')
    if (fromEmbed) return fromEmbed

    const fromShorts = idxAfter('shorts')
    if (fromShorts) return fromShorts

    const fromLive = idxAfter('live')
    if (fromLive) return fromLive

    if (parts[0] === 'watch' && parts[1] && isLikelyYouTubeVideoId(parts[1])) {
      return parts[1]
    }

    return null
  } catch {
    return null
  }
}

export function classifyUrl(url: string): UrlType {
  if (isGitHubUrl(url)) {
    return 'github'
  }
  if (isTwitterUrl(url)) {
    return 'twitter'
  }
  if (parseYouTubeVideoId(url)) {
    return 'youtube'
  }
  return 'generic'
}

export function isGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com'
    )
  } catch {
    return false
  }
}

export function parseGitHubRepo(
  url: string
): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url)
    if (
      parsed.hostname !== 'github.com' &&
      parsed.hostname !== 'www.github.com'
    ) {
      return null
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    if (pathParts.length < 2) {
      return null
    }

    const [owner, repo] = pathParts
    if (!owner || !repo) {
      return null
    }

    // Remove .git suffix if present
    const cleanRepo = repo.replace(/\.git$/, '')

    return { owner, repo: cleanRepo }
  } catch {
    return null
  }
}

export function isTwitterUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return twitterHosts.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Path “extension” from URL string, matching open-graph-scraper’s `findImageTypeFromUrl`
 * (last `.` segment, query stripped).
 */
function urlPathExtensionForOgs(url: string): string {
  const last = url.split('.').pop() ?? ''
  return last.split('?')[0]?.toLowerCase() ?? ''
}

/**
 * Non-HTML URLs that open-graph-scraper rejects before fetch (`isThisANonHTMLUrl`).
 * Keep in sync with `open-graph-scraper` lib/utils `invalidImageTypes` for consistent behavior.
 */
const NON_HTML_URL_EXTENSIONS = new Set([
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  '3gp',
  'avi',
  'mov',
  'mp4',
  'm4v',
  'm4a',
  'mp3',
  'mkv',
  'ogv',
  'ogm',
  'ogg',
  'oga',
  'webm',
  'wav',
  'bmp',
  'gif',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'zip',
  'rar',
  'tar',
  'gz',
  'tgz',
  'bz2',
  'tbz2',
  'txt',
  'pdf',
])

/** True when the URL likely points at a document/media/archive, not an HTML page (no Open Graph scrape). */
export function isLikelyNonHtmlUrl(url: string): boolean {
  const ext = urlPathExtensionForOgs(url)
  if (ext && NON_HTML_URL_EXTENSIONS.has(ext)) return true
  return false
}

/** Figma blocks server-side/Open Graph fetches (403); skip auto metadata. */
export function isFigmaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'figma.com' || host.endsWith('.figma.com')
  } catch {
    return false
  }
}

export function extractTweetId(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (!twitterHosts.includes(parsed.hostname)) {
      return null
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    const statusIndex = pathParts.indexOf('status')
    if (statusIndex === -1 || statusIndex >= pathParts.length - 1) {
      return null
    }

    const tweetId = pathParts[statusIndex + 1]
    if (!tweetId || !/^\d+$/.test(tweetId)) {
      return null
    }

    return tweetId
  } catch {
    return null
  }
}

/**
 * Username segment from standard tweet URLs: `/{handle}/status/{id}`.
 * Returns null for `i/status/...`, `i/web/status/...`, or non-tweet paths.
 */
export function extractTwitterHandleFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!twitterHosts.includes(parsed.hostname)) {
      return null
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    const statusIndex = pathParts.indexOf('status')
    if (statusIndex < 1) {
      return null
    }

    const candidate = pathParts[statusIndex - 1]
    if (!candidate) {
      return null
    }
    const lower = candidate.toLowerCase()
    if (lower === 'i' || lower === 'intent' || lower === 'home' || lower === 'search') {
      return null
    }
    // X/Twitter handles: letters, digits, underscore; max 15 (exclude obvious non-handles)
    if (!/^[A-Za-z0-9_]{1,15}$/.test(candidate)) {
      return null
    }

    return candidate
  } catch {
    return null
  }
}

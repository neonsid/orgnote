/**
 * URL classification utilities for determining the type of URL being processed
 */

export type UrlType = 'github' | 'twitter' | 'generic'

/**
 * Classifies a URL into one of the supported types
 */
export function classifyUrl(url: string): UrlType {
  if (isGitHubUrl(url)) {
    return 'github'
  }
  if (isTwitterUrl(url)) {
    return 'twitter'
  }
  return 'generic'
}

/**
 * Checks if a URL is a GitHub repository URL
 */
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

/**
 * Parses a GitHub URL to extract owner and repo
 * Returns null if not a valid GitHub repo URL
 */
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

/**
 * Checks if a URL is a Twitter/X URL
 */
export function isTwitterUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const twitterHosts = [
      'twitter.com',
      'www.twitter.com',
      'x.com',
      'www.x.com',
    ]
    return twitterHosts.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Extracts the tweet ID from a Twitter/X URL
 * Returns null if not a valid tweet URL
 */
export function extractTweetId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const twitterHosts = [
      'twitter.com',
      'www.twitter.com',
      'x.com',
      'www.x.com',
    ]

    if (!twitterHosts.includes(parsed.hostname)) {
      return null
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    // Twitter URLs are typically: /username/status/123456789
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

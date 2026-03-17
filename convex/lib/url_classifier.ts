/**
 * URL classification utilities for determining the type of URL being processed
 */

import { twitterHosts } from './constants'

export type UrlType = 'github' | 'twitter' | 'generic'

export function classifyUrl(url: string): UrlType {
  if (isGitHubUrl(url)) {
    return 'github'
  }
  if (isTwitterUrl(url)) {
    return 'twitter'
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

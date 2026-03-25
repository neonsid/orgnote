'use node'

import { MAX_GITHUB_README_LENGTH } from '../lib/constants'

/**
 * Fetch GitHub README content from raw.githubusercontent.com
 */
export async function fetchGitHubReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    let url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`
    let response = await fetch(url)

    if (!response.ok) {
      url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/readme.md`
      response = await fetch(url)
    }

    if (!response.ok) {
      return null
    }

    const text = await response.text()
    return text.length > MAX_GITHUB_README_LENGTH
      ? text.slice(0, MAX_GITHUB_README_LENGTH) + '...'
      : text
  } catch (error) {
    console.error('Failed to fetch README:', error)
    return null
  }
}

/**
 * Repository title and description from the GitHub API.
 */
export async function fetchGitHubRepoTitle(
  owner: string,
  repo: string
): Promise<{ name: string; description: string | null }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Orgnote-Bookmark-Manager',
        },
      }
    )

    if (!response.ok) {
      return { name: `${owner}/${repo}`, description: null }
    }

    const data = (await response.json()) as {
      name?: string
      description?: string | null
    }
    return {
      name: data.name || `${owner}/${repo}`,
      description: data.description || null,
    }
  } catch (error) {
    console.error('Failed to fetch GitHub repo info:', error)
    return { name: `${owner}/${repo}`, description: null }
  }
}

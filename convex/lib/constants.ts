import { MAX_BOOKMARK_URL_LENGTH } from '../../lib/url-limits'

export const ALLOWED_FILE_TYPES = [
  'image/',
  'video/',
  'application/pdf',
  'application/msword',
  'application/zip',
  'audio/',
  'text/',
]

export const MAX_BULK_BOOKMARK_DELETE = 100
export const MAX_BULK_BOOKMARK_MOVE = 100
export const MAX_BULK_BOOKMARK_IMPORT = 100

export const SCIRA_DAILY_LIMIT = 20
export const MAX_FILENAME_LENGTH = 255

export const MAX_GITHUB_README_LENGTH = 3000
export const MAX_DESCRIPTION_LENGTH = 150

/**
 * `open-graph-scraper` `timeout` is in seconds (library default 10).
 * Slow sites / cold starts often exceed 10s from Convex actions.
 */
export const OPEN_GRAPH_FETCH_TIMEOUT_SECONDS = 30

/**
 * Undici (used by open-graph-scraper) defaults to a low redirect cap; long chains fail with "redirect count exceeded".
 */
export const OPEN_GRAPH_MAX_REDIRECTIONS = 32

/** Browser-like UA — some hosts return 403 to generic or datacenter clients. */
export const OPEN_GRAPH_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export const OPEN_GRAPH_FETCH_ACCEPT_LANGUAGE = 'en-US,en;q=0.9'

export const SCIRA_API_URL = 'https://api.scira.ai/api/xsearch'
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

export const MAX_URL_LENGTH = MAX_BOOKMARK_URL_LENGTH
export const ALLOWED_URL_PROTOCOLS = ['http:', 'https:']

/** Max groups returned in list/dashboard queries (separate from per-group bookmark cap). */
export const MAX_GROUPS_PER_QUERY = 500

/**
 * Max bookmarks fetched per group for dashboard lists, import duplicate checks, etc.
 * Raising this or splitting “UI limit” vs “import check limit” is follow-up if needed.
 */
export const MAX_BOOKMARKS_PER_QUERY = 100

export const twitterHosts = [
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
]

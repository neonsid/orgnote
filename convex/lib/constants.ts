export const ALLOWED_FILE_TYPES = [
  'image/',
  'video/',
  'application/pdf',
  'application/msword',
  'application/zip',
  'audio/',
  'text/',
]

export const SCIRA_DAILY_LIMIT = 20
export const MAX_FILENAME_LENGTH = 255

export const MAX_GITHUB_README_LENGTH = 3000
export const MAX_DESCRIPTION_LENGTH = 150

export const SCIRA_API_URL = 'https://api.scira.ai/api/xsearch'
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

export const MAX_URL_LENGTH = 2000
export const ALLOWED_URL_PROTOCOLS = ['http:', 'https:']

export const MAX_BOOKMARKS_PER_QUERY = 500

export const twitterHosts = [
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
]

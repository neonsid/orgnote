/**
 * MIME type to file extension mapping for common types.
 * Used to ensure downloaded files have correct extensions.
 */
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
  'application/json': 'json',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
}

function getExtensionForMime(mimeType: string): string | null {
  return MIME_TO_EXT[mimeType] ?? null
}

function hasExtension(name: string): boolean {
  const lastDot = name.lastIndexOf('.')
  return lastDot > 0 && lastDot < name.length - 1
}

/**
 * Ensures the filename has an appropriate extension based on MIME type.
 * Truncates very long names to a reasonable length while preserving extension.
 */
export function getDownloadFilename(name: string, mimeType: string): string {
  let baseName = name
  let ext = ''

  if (hasExtension(name)) {
    const lastDot = name.lastIndexOf('.')
    baseName = name.slice(0, lastDot)
    ext = name.slice(lastDot)
  } else {
    const mimeExt = getExtensionForMime(mimeType)
    if (mimeExt) {
      ext = `.${mimeExt}`
    }
  }

  // Limit base name length (e.g. 200 chars) to avoid overly long filenames
  const maxBaseLength = 200
  if (baseName.length > maxBaseLength) {
    baseName = baseName.slice(0, maxBaseLength)
  }

  return baseName + ext
}

/**
 * Returns proxy URL for vault files to avoid CORS. The API route validates
 * the URL server-side and fetches from R2 (no CORS on server).
 */
export function getProxyDownloadUrl(url: string, filename: string): string {
  const params = new URLSearchParams({ url, filename })
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/download-vault-file?${params}`
  }
  return `/api/download-vault-file?${params}`
}

/**
 * Downloads a file from a URL via our API proxy to avoid CORS.
 * Ensures correct filename with extension.
 */
export async function downloadFile(
  url: string,
  filename: string,
  mimeType: string
): Promise<void> {
  const downloadName = getDownloadFilename(filename, mimeType)
  const proxyUrl = getProxyDownloadUrl(url, downloadName)

  const response = await fetch(proxyUrl, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  try {
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = downloadName
    link.click()
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

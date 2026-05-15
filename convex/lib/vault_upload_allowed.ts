import { ALLOWED_FILE_TYPES } from './constants'

/** True when the vault may accept this upload (Convex + R2 presign path). */
export function isAllowedVaultUploadType(fileName: string, fileType: string): boolean {
  const name = fileName.toLowerCase()
  if (name.endsWith('.epub')) {
    return true
  }
  return ALLOWED_FILE_TYPES.some((prefix) => fileType.startsWith(prefix))
}

/** Fill missing MIME when the extension implies a known vault type (e.g. some pickers send ""). */
export function normalizeVaultFileTypeForUpload(fileName: string, fileType: string): string {
  const trimmed = fileType.trim()
  if (trimmed) return trimmed
  if (fileName.toLowerCase().endsWith('.epub')) {
    return 'application/epub+zip'
  }
  return trimmed
}

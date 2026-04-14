/** Shared limits: URL length is defined in Convex (`convex/lib/url_limits.ts`). */
export { MAX_BOOKMARK_URL_LENGTH } from '../../../convex/lib/url_limits'

/** Max `.html` bookmark export file size before client-side parse. */
export const MAX_BOOKMARK_IMPORT_HTML_BYTES = 5 * 1024 * 1024

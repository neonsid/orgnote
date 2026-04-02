function getErrorName(error: unknown): string {
  if (error !== null && typeof error === 'object' && 'name' in error) {
    const n = (error as { name: unknown }).name
    return typeof n === 'string' ? n : ''
  }
  return ''
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error !== null && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
}

/**
 * AI SDK / Node abort or timeout (including DOMException, `AbortSignal.timeout`, etc.).
 * Used for friendly errors and to recognize failures that should try a fallback model.
 */
export function isTimeoutOrAbortError(error: unknown): boolean {
  const name = getErrorName(error)
  const msg = getErrorMessage(error)
  if (name === 'AbortError' || name === 'TimeoutError') return true
  if (/aborted|timeout/i.test(msg)) return true
  return false
}

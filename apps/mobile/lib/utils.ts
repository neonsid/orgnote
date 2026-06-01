export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Google favicon service URL (matches Convex `faviconUrlForHttpUrl`). */
export function faviconUrlForUrl(url: string): string {
  const hostname = getHostname(url);
  if (!hostname) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

export function bookmarkIconUrl(url: string, imageUrl?: string): string {
  const stored = imageUrl?.trim();
  if (stored && (stored.startsWith("http://") || stored.startsWith("https://"))) {
    return stored;
  }
  return faviconUrlForUrl(url);
}

export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

function isValidUrl(input: string): boolean {
  try {
    new URL(normalizeUrl(input));
    return true;
  } catch {
    return false;
  }
}

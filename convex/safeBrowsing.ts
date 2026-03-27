import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import { internal } from './_generated/api'

const SAFE_BROWSING_ENDPOINT =
  'https://safebrowsing.googleapis.com/v4/threatMatches:find'

type ThreatMatchesResponse = {
  matches?: Array<{ threatType?: string }>
}

function normalizeUrlForLookup(raw: string): string {
  const trimmed = raw.trim()
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return trimmed
    return u.href
  } catch {
    return trimmed
  }
}

/**
 * Safe Browsing list entries are keyed by specific URL forms; try a few
 * canonical variants in one request (still counts as one logical check).
 * Note: Google's public API often matches `.../s/malware.html` but not
 * `.../s/phishing.html` — use malware.html to verify the integration.
 */
function safeBrowsingLookupUrlVariants(raw: string): string[] {
  const primary = normalizeUrlForLookup(raw)
  const variants = new Set<string>([primary])
  try {
    const u = new URL(primary)
    if (u.protocol === 'https:') {
      variants.add(`http://${u.host}${u.pathname}${u.search}${u.hash}`)
    } else if (u.protocol === 'http:') {
      variants.add(`https://${u.host}${u.pathname}${u.search}${u.hash}`)
    }
    if (u.pathname.length > 1 && !u.pathname.endsWith('/')) {
      const withSlash = new URL(primary)
      withSlash.pathname = `${u.pathname}/`
      variants.add(withSlash.href)
    }
  } catch {
    /* keep primary only */
  }
  return [...variants]
}

async function lookupUrlHasThreat(
  url: string,
  apiKey: string,
): Promise<boolean> {
  const lookupUrl = `${SAFE_BROWSING_ENDPOINT}?key=${encodeURIComponent(apiKey)}`
  const body = {
    client: {
      clientId: 'orgnote',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: safeBrowsingLookupUrlVariants(url).map((u) => ({ url: u })),
    },
  }

  const res = await fetch(lookupUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[SafeBrowsing] API HTTP error', res.status, text)
    return false
  }

  const data = (await res.json()) as ThreatMatchesResponse
  return Array.isArray(data.matches) && data.matches.length > 0
}

export const getBookmarkUrlForSafetyCheck = internalQuery({
  args: { bookmarkId: v.id('bookmarks') },
  returns: v.union(v.null(), v.object({ url: v.string() })),
  handler: async (ctx, args) => {
    const b = await ctx.db.get(args.bookmarkId)
    if (!b) return null
    return { url: b.url }
  },
})

export const applyUrlSafetyScanResult = internalMutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    blocked: v.boolean(),
    checkedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const b = await ctx.db.get(args.bookmarkId)
    if (!b) return null
    await ctx.db.patch(args.bookmarkId, {
      publicListingBlockedForUrlSafety: args.blocked,
      urlSafetyCheckedAt: args.checkedAt,
    })
    return null
  },
})

export const checkBookmarkUrlInternal = internalAction({
  args: { bookmarkId: v.id('bookmarks') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.runQuery(
      internal.safeBrowsing.getBookmarkUrlForSafetyCheck,
      { bookmarkId: args.bookmarkId },
    )
    if (!row) return null

    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      console.warn(
        '[SafeBrowsing] GOOGLE_SAFE_BROWSING_API_KEY not set; skipping URL check',
      )
      return null
    }

    let blocked = false
    try {
      blocked = await lookupUrlHasThreat(row.url, apiKey)
    } catch (e) {
      console.error('[SafeBrowsing] lookup failed', e)
      return null
    }

    const checkedAt = Date.now()
    await ctx.runMutation(internal.safeBrowsing.applyUrlSafetyScanResult, {
      bookmarkId: args.bookmarkId,
      blocked,
      checkedAt,
    })
    return null
  },
})

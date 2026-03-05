# Backend Implementation Plan

## Overview

This document outlines the backend implementation for adding AI-generated bookmark descriptions with URL safety checking.

## Model Selection

- **Provider**: OpenRouter
- **Model**: `openai/gpt-oss-120b` (free tier, good overall performance)
- **Alternative**: `google/gemma-3-27b-it` (if rate limits hit)

## New Files

### 1. `convex/lib/url-classifier.ts`

URL classification utilities to determine the type of URL being processed.

**Exports:**

- `classifyUrl(url: string): 'github' | 'twitter' | 'x' | 'generic'`
- `parseGitHubRepo(url: string): { owner: string; repo: string } | null`
- `isTwitterUrl(url: string): boolean`
- `isBlockedDomain(url: string): boolean` - Basic domain blacklist check

### 2. `convex/metadata.ts`

Actions for fetching and generating bookmark metadata.

**Actions:**

- `checkUrlSafety(url: string)` - Checks URL against Google Safe Browsing API
- `fetchGitHubReadme(owner: string, repo: string)` - Fetches raw README from GitHub
- `fetchGenericMetadata(url: string)` - Uses open-graph-scraper for metadata
- `generateBookmarkMetadata(url: string)` - Main orchestrator action:
  1. Check URL safety (Google Safe Browsing)
  2. Classify URL type
  3. Fetch raw metadata based on type
  4. Use AI SDK with OpenRouter to generate 10-20 word description
  5. Return: `{ title?, description, imageUrl?, isSafe }`

## Modified Files

### `convex/bookmarks.ts`

Add new mutation:

```typescript
updateBookmarkDetails = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.string(),
  },
  // Updates whichever fields are provided
});
```

## Environment Variables (Convex Dashboard)

- `OPENROUTER_API_KEY` - OpenRouter API key
- `GOOGLE_SAFE_BROWSING_API_KEY` - Google Safe Browsing API key (free)

## Dependencies to Install

```bash
pnpm add open-graph-scraper ai @openrouter/ai-sdk-provider
```

## URL Safety Layers

### Layer 1: Google Safe Browsing API

- Checks URLs against malware, phishing, and adult content lists
- Free for non-commercial use
- 500 URLs per request
- Requires Google Cloud project setup

### Layer 2: Content-Based Filtering

- Scan fetched Open Graph metadata for adult keywords
- Reject if title/description indicates adult content

## Data Flow

```
User requests AI description
         │
         ▼
[checkUrlSafety] - Google Safe Browsing API
         │
         ├─► Unsafe? → Return error
         │
         ▼ Safe
[classifyUrl] → GitHub | Twitter/X | Generic
         │
         ▼
[Fetch metadata based on type]
         │
         ▼
[Generate with OpenRouter]
  Model: openai/gpt-oss-120b
  Prompt: "Summarize this content in 10-20 words for a bookmark description"
         │
         ▼
[Return description]
```

## Rate Limiting Considerations

- Implement rate limiting for metadata generation (reuse existing `rateLimiter`)
- Cache results for identical URLs (24-hour TTL)
- Limit to ~10 AI generations per user per minute

## Error Handling

- Unsafe URL: Return clear error message to user
- Metadata fetch failure: Return partial data or fallback to URL-based description
- AI generation failure: Return error with retry option
- GitHub README too long: Truncate to first 2000 chars before AI

## Future Enhancements

- Twitter/X integration via Skyra API
- Caching layer for generated descriptions
- User preference for description length (short/medium/long)

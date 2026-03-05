# Backend Implementation Plan (Updated)

## Overview

Simplified implementation for AI-generated bookmark descriptions. **NO automatic group management** - just description generation from metadata.

## Data Flow

```
User clicks "Generate with AI" in Edit Dialog
              │
              ▼
    [Classify URL Type]
              │
    ┌─────────┼─────────┐
    │         │         │
 Twitter   GitHub    Generic
    │         │         │
    ▼         ▼         ▼
[Skyra]  [README]  [Open Graph]
    │         │         │
    └─────────┼─────────┘
              ▼
    [AI generates description]
      Model: openai/gpt-oss-120b
      Input: Fetched metadata
      Output: 10-20 word description
              │
              ▼
    [Return to frontend]
```

## Model Selection

- **Provider**: OpenRouter
- **Model**: `openai/gpt-oss-120b` (free tier)
- **Fallback**: `google/gemma-3-27b-it` (if rate limited)

## New Files

### 1. `convex/lib/url-classifier.ts`

URL classification utilities.

**Exports:**

- `classifyUrl(url: string): 'github' | 'twitter' | 'generic'`
- `parseGitHubRepo(url: string): { owner: string; repo: string } | null`
- `isTwitterUrl(url: string): boolean`

### 2. `convex/lib/skyra.ts`

Skyra API wrapper with rate limiting.

**Exports:**

- `fetchTweetContent(url: string, apiKey: string)` - Fetches tweet via Skyra API
- `checkSkyraQuota(userId: string, ctx)` - Checks remaining daily quota
- `incrementSkyraQuota(userId: string, ctx)` - Increments usage counter

### 3. `convex/metadata.ts`

Main actions for metadata fetching and AI generation.

**Actions:**

#### `fetchRawMetadata(args: { url: string, userId: string })`

Fetches metadata based on URL type:

- **Twitter/X**: Calls Skyra API (checks quota first)
- **GitHub**: Fetches raw README.md
- **Generic**: Uses open-graph-scraper

Returns: `{ title?: string, content: string, imageUrl?: string, type: 'twitter' | 'github' | 'generic' }`

#### `generateDescription(args: { url: string, title?: string, content: string })`

Generates description using OpenRouter AI:

- Constructs prompt from metadata
- Calls OpenRouter with gpt-oss-120b
- Returns: `{ description: string }`

#### `generateBookmarkDescription(args: { url: string, userId: string })` (Main Entry)

Orchestrates the flow:

1. Classify URL
2. Fetch raw metadata (with Skyra quota check for Twitter)
3. Generate AI description
4. Return: `{ title?: string, description: string, imageUrl?: string }`

**Error Handling:**

- Skyra quota exceeded: Return error with manual fallback message
- Metadata fetch fails: Return partial data or error
- AI generation fails: Return error with retry option

## Skyra Rate Limiting

### Schema Addition

```typescript
skyraUsage: defineTable({
  userProvidedId: v.string(),
  date: v.string(), // YYYY-MM-DD format
  requestCount: v.number(),
}).index("by_user_date", ["userProvidedId", "date"]);
```

### Logic

- Check daily count for user
- Limit: 20 requests per day
- If exceeded: Return `{ error: 'QUOTA_EXCEEDED', message: 'Skyra daily limit reached (20/day). Enter description manually or try again tomorrow.' }`

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
  handler: async (ctx, args) => {
    // Verify ownership
    // Update provided fields
    // Return success
  },
});
```

## Dependencies

```bash
pnpm add open-graph-scraper ai @openrouter/ai-sdk-provider
```

## Environment Variables (Convex Dashboard)

- `OPENROUTER_API_KEY` - OpenRouter API key
- `SKYRA_API_KEY` - Skyra API key

## Prompt Design

### For AI Description Generation

```
You are a helpful assistant that creates concise bookmark descriptions.

URL: {url}
Title: {title}
Content: {content}

Create a description of 10-20 words that summarizes what this link contains.
The description should help the user remember why they saved this bookmark.

Rules:
- 10-20 words maximum
- Clear and informative
- No marketing fluff
- Just the description, no quotes or prefixes

Description:
```

## Error Handling

| Scenario               | Response                                                                         |
| ---------------------- | -------------------------------------------------------------------------------- |
| Skyra quota exceeded   | Error: "Daily X/Twitter limit reached (20/day). Enter manually or try tomorrow." |
| Metadata fetch failed  | Error: "Could not fetch page content. Check URL or enter description manually."  |
| AI generation failed   | Error: "AI generation failed. Try again or enter description manually."          |
| GitHub README too long | Truncate to 3000 chars before sending to AI                                      |

## Security Considerations

- URLs are validated before fetching
- No URL safety API (Google Safe Browsing) for now - can be added later
- Skyra API key stored in Convex secrets
- OpenRouter API key stored in Convex secrets

## Future Enhancements (Not in Scope)

- URL safety checking (malicious/adult content)
- Caching of generated descriptions
- Auto-generate on bookmark creation
- User preference for description length

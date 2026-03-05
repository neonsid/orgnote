# AI Agents Architecture Plan

## Overview

Two specialized AI agents for intelligent bookmark management:

1. **Skyra Agent** - Handles X/Twitter links exclusively
2. **General Agent** - Handles GitHub repos and general article links

## Agent 1: Skyra Agent (X/Twitter Links)

### Purpose

Process X/Twitter links using Skyra API for content analysis and description generation.

### Capabilities

- Fetch tweet content via Skyra API
- Generate concise 10-20 word descriptions
- Respect rate limits (20 requests/day)

### Rate Limiting Strategy

```
Daily Limit: 20 requests
Tracking: Per-user daily counter stored in Convex
When limit reached:
  - Option 1: Show error "Daily X link limit reached (20/day)"
  - Option 2: Fallback to generic description from URL metadata only
```

### Input/Output

**Input:** X/Twitter URL (e.g., `https://x.com/elonmusk/status/123456`)
**Process:**

1. Check if user has remaining Skyra quota
2. Call Skyra API to fetch tweet content
3. Use OpenRouter AI (gpt-oss-120b) to summarize tweet
   **Output:** `{ description: string, author?: string, postedAt?: string }`

### Storage

```typescript
// Track Skyra usage per user
skyraUsage: defineTable({
  userProvidedId: v.string(),
  date: v.string(), // YYYY-MM-DD
  requestCount: v.number(),
}).index("by_user_date", ["userProvidedId", "date"]);
```

---

## Agent 2: General Agent (GitHub + Articles)

### Purpose

Process GitHub repositories and general web articles with intelligent group management.

### Capabilities

- **For GitHub Links:**
  - Fetch README.md content
  - Analyze repository metadata
  - Generate description
  - Suggest/create appropriate group

- **For Article Links:**
  - Fetch Open Graph metadata
  - Analyze content
  - Generate description
  - Suggest/create appropriate group

### Tools Available to General Agent

```typescript
// Tool 1: Get User's Groups
type getUserGroups = () => Promise<{
  groups: Array<{
    id: string;
    title: string;
    color: string;
    bookmarkCount: number;
  }>;
}>;

// Tool 2: Create New Group
type createGroup = (args: {
  title: string;
  color: string;
}) => Promise<{ groupId: string }>;

// Tool 3: Add Bookmark to Group
type addBookmark = (args: {
  groupId: string;
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
}) => Promise<{ bookmarkId: string }>;
```

### Decision Flow for General Agent

```
User provides URL
        │
        ▼
[Classify URL Type]
        │
   ┌────┴────┐
 GitHub    Article
   │          │
   ▼          ▼
[Fetch      [Fetch
 README]     Metadata]
   │          │
   └────┬─────┘
        ▼
[Analyze Content + User's Existing Groups]
        │
        ▼
[Decide: Which group fits best?]
        │
   ┌────┴────┐
 Existing  Create New
 Group     Group?
   │          │
   ▼          ▼
[Add to   [Create Group
 Group]    + Add Bookmark]
```

### Group Selection Logic

The agent will:

1. Get all user's existing groups
2. Analyze the content (GitHub repo topic / Article category)
3. Match to existing group by semantic similarity
4. If no good match (>80% confidence), suggest creating new group
5. Generate appropriate group name and color

### Example Decisions

| URL                        | Analysis                     | Action                                                   |
| -------------------------- | ---------------------------- | -------------------------------------------------------- |
| github.com/facebook/react  | JavaScript library, Frontend | Add to "Frontend" group (if exists) or create "Frontend" |
| medium.com/article-on-rust | Programming, Rust            | Add to "Programming" group or create "Rust"              |
| github.com/torvalds/linux  | Kernel, C, Systems           | Create "Systems" group                                   |
| dev.to/article-on-react    | React, Frontend              | Add to "Frontend" group                                  |

---

## UX Design: Manual vs Agent Entry

### Current Flow (Manual)

```
User selects group → Pastes URL → Bookmark created in that group
```

### Proposed Hybrid Flow Options

#### Option A: Smart Suggest Mode (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│  [Search/Add Bar]                              [AI Mode ▼]  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Smart Suggest  │
                    │  Manual Only    │
                    │  AI Auto-Group  │
                    └─────────────────┘

Smart Suggest Mode:
- User pastes URL
- System shows suggestion card:
  ┌─────────────────────────────────────┐
  │ 🤖 AI Suggestion                    │
  │                                     │
  │ Title: React Documentation          │
  │ Group: Frontend (existing)          │
  │ Description: Official docs for...   │
  │                                     │
  │ [Accept]  [Edit]  [Manual]          │
  └─────────────────────────────────────┘
- User can accept, edit details, or switch to manual
```

#### Option B: Command Palette Style

```
User types: "/ai https://github.com/facebook/react"
System processes with AI agent
Shows preview card before saving
User confirms or cancels
```

#### Option C: Dedicated AI Input

```
┌─────────────────────────────────────────────────────────────┐
│  [Manual URL]  │  [✨ AI Smart Add]                          │
└─────────────────────────────────────────────────────────────┘

Clicking "AI Smart Add" opens modal:
┌─────────────────────────────────────────┐
│  ✨ AI Smart Add                    [×] │
├─────────────────────────────────────────┤
│                                         │
│  Paste URL:                             │
│  ┌─────────────────────────────────┐    │
│  │ https://github.com/...          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Process with AI]                      │
│                                         │
│  ──────── Suggestion ────────          │
│                                         │
│  Title: React                           │
│  Group: Frontend (existing)            │
│  Description: A JavaScript library...  │
│                                         │
│              [Edit]  [Save]             │
│                                         │
└─────────────────────────────────────────┘
```

#### Option D: Contextual Right-Click

```
Right-click in group:
├─ Paste URL (Manual - current behavior)
└─ ✨ Paste with AI (Agent processes URL)
```

---

## Implementation Components

### Backend Actions

#### `agents/generalAgent.ts`

```typescript
export const processWithGeneralAgent = action({
  args: {
    url: v.string(),
    userId: v.string(),
    preferredGroupId: v.optional(v.id("groups")), // User can suggest a group
  },
  returns: v.object({
    title: v.string(),
    description: v.string(),
    suggestedGroup: v.object({
      action: v.union(v.literal("use_existing"), v.literal("create_new")),
      groupId: v.optional(v.id("groups")),
      proposedGroupName: v.optional(v.string()),
      proposedColor: v.optional(v.string()),
    }),
    imageUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // 1. Classify URL (GitHub vs Article)
    // 2. Fetch metadata accordingly
    // 3. Get user's groups
    // 4. Use AI to decide group placement
    // 5. Return suggestion
  },
});
```

#### `agents/skyraAgent.ts`

```typescript
export const processWithSkyraAgent = action({
  args: {
    url: v.string(),
    userId: v.string(),
    groupId: v.id("groups"),
  },
  returns: v.object({
    description: v.string(),
    author: v.optional(v.string()),
    postedAt: v.optional(v.number()),
    remainingQuota: v.number(),
  }),
  handler: async (ctx, args) => {
    // 1. Check daily quota
    // 2. Call Skyra API
    // 3. Generate description with AI
    // 4. Update quota
    // 5. Return result
  },
});
```

---

## Open Questions for User

### 1. UX Preference

Which interaction model do you prefer?

- **A:** Smart Suggest (AI suggests, user approves/edits)
- **B:** Command style (/ai prefix)
- **C:** Dedicated AI button/modal
- **D:** Contextual right-click menu
- **E:** Other idea?

### 2. Group Creation Permissions

When AI suggests creating a new group:

- Should it create immediately?
- Or ask user for confirmation?
- Or give user 3 group name options to choose from?

### 3. Skyra Fallback

When Skyra quota (20/day) is exhausted:

- Block X links entirely with error?
- Fallback to generic URL metadata (no tweet content)?
- Queue for next day?

### 4. Description Generation Trigger

- Auto-generate for all links?
- Only when user clicks "Generate with AI"?
- Configurable per-user setting?

### 5. Agent Visibility

- Should users know an AI agent processed their link?
- Or make it feel like smart defaults?
- Show "✨ AI Organized" badge on bookmarks?

### 6. Error Handling

If AI service (OpenRouter) is down:

- Skip AI features, create bookmark normally?
- Show error and let user retry?
- Queue for later processing?

---

## Technical Stack

### AI Provider

- **OpenRouter** with `openai/gpt-oss-120b` (free tier)
- Fallback: `google/gemma-3-27b-it` (free tier)

### External APIs

- **Skyra API** - X/Twitter content (20 req/day limit)
- **Google Safe Browsing** - URL safety check
- **GitHub Raw** - README fetching
- **Open Graph Scraper** - General website metadata

### Dependencies

```bash
pnpm add open-graph-scraper ai @openrouter/ai-sdk-provider
```

### Environment Variables

```
OPENROUTER_API_KEY=
SKYRA_API_KEY=
GOOGLE_SAFE_BROWSING_API_KEY=
```

---

## Future Enhancements

1. **Learning Mode** - Agent learns from user's past group choices
2. **Batch Processing** - Drop multiple URLs, AI organizes all
3. **Smart Search** - "Find my React bookmarks" → AI searches descriptions
4. **Auto-archive** - AI suggests archiving old/unused bookmarks
5. **Duplicate Detection** - AI identifies similar bookmarks across groups

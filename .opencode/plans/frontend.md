# Frontend Implementation Plan (Updated)

## Overview

UI for editing bookmarks with AI-powered description generation. **Simple flow** - no agents, just a "Generate with AI" button.

## User Flow

```
1. User right-clicks bookmark → Context menu
2. User clicks "Edit..." → Dialog opens
3. Dialog shows:
   - Title input (editable)
   - URL input (editable)
   - Description textarea (empty or existing)
   - "✨ Generate with AI" button
4. User clicks "Generate with AI"
   - Button shows loading state
   - Backend fetches metadata + generates description
   - Description appears in textarea
5. User can edit the generated description
6. User clicks "Save" → Updates bookmark
```

## New Files

### `components/dashboard/edit-bookmark-dialog.tsx`

Main dialog for editing bookmark details with AI generation.

**Props:**

```typescript
interface EditBookmarkDialogProps {
  bookmark: {
    id: string;
    title: string;
    url: string;
    description?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}
```

**State:**

```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [description, setDescription] = useState(bookmark?.description || "");
const [title, setTitle] = useState(bookmark?.title || "");
const [url, setUrl] = useState(bookmark?.url || "");
```

**Features:**

- Title input (shadcn `Input`)
- URL input (shadcn `Input`)
- Description textarea (shadcn `Textarea`)
  - 3 rows
  - Max 150 chars (~20 words)
  - Character counter
- "✨ Generate with AI" button (shadcn `Button` variant="outline")
  - Loading state: "⏳ Generating..."
  - Disabled during generation
  - On click: calls `generateBookmarkDescription` action
- "Save" button (shadcn `Button`)
- "Cancel" button (shadcn `Button` variant="outline")

**Error Handling:**

- Skyra quota exceeded: Show toast "Daily X/Twitter limit reached. Enter manually or try tomorrow."
- Generation failed: Show toast "Failed to generate. Try again or enter manually."

## Modified Files

### `stores/dialog-store.ts`

Add edit bookmark dialog state:

```typescript
editBookmark: {
  open: boolean;
  bookmarkId: string | null;
  bookmarkData: {
    id: string;
    title: string;
    url: string;
    description?: string;
  } | null;
}

// Actions
openEditBookmarkDialog: (bookmarkId: string, bookmarkData: {...}) => void;
closeEditBookmarkDialog: () => void;
```

### `lib/validation.ts`

Add schema:

```typescript
export const editBookmarkSchema = z.object({
  title: bookmarkTitleSchema,
  url: z.string().url("Please enter a valid URL"),
  description: z.string().max(150, "Max 150 characters").optional(),
});

export type EditBookmarkFormData = z.infer<typeof editBookmarkSchema>;
```

### `components/dashboard/bookmark-list/menu.tsx`

Add to context menu:

```
Mark as Read
Copy           ⌘C
Rename         ⌘R
Edit...        ⌘E    ← NEW
───────────────
Move to        →
───────────────
Delete         ⌘⌫
```

### `components/dashboard/index.tsx`

- Import `EditBookmarkDialog`
- Add dialog state from store
- Add `openEditBookmarkDialog` handler
- Wire up `updateBookmarkDetails` mutation
- Pass `generateBookmarkDescription` action to dialog

### `components/dashboard/bookmark-list/types.ts`

Update Bookmark type:

```typescript
export interface Bookmark {
  id: Id<"bookmarks">;
  title: string;
  domain: string;
  url: string;
  favicon: string;
  fallbackColor: string;
  createdAt: string;
  groupId: Id<"groups">;
  doneReading: boolean;
  description?: string; // ← NEW
}
```

### `components/dashboard/bookmark-list/bookmark-item.tsx`

Add description tooltip on hover:

- If bookmark has description, show tooltip below item
- Use shadcn `Tooltip` component

## UI Design

### Edit Dialog

```
┌─────────────────────────────────────────────┐
│  Edit Bookmark                          [×] │
├─────────────────────────────────────────────┤
│                                             │
│  Title                                      │
│  ┌─────────────────────────────────────┐    │
│  │ React Documentation                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  URL                                        │
│  ┌─────────────────────────────────────┐    │
│  │ https://react.dev                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Description                                │
│  ┌─────────────────────────────────────┐    │
│  │ The library for building user       │    │
│  │ interfaces with components.         │    │
│  └─────────────────────────────────────┘    │
│                              18/150 chars   │
│                                             │
│  [✨ Generate with AI]     [Cancel] [Save]  │
│                                             │
└─────────────────────────────────────────────┘
```

### Loading State

```
[⏳ Generating...]  ← Button disabled, spinner + text
```

### Error Toast Examples

- **Skyra quota**: "Daily X/Twitter limit reached (20/day). Enter description manually or try tomorrow."
- **Generation failed**: "Failed to generate description. Try again or enter manually."
- **URL fetch failed**: "Could not fetch page content. Check the URL."

### Hover Tooltip (When Description Exists)

```
┌─────────────────────────────────────────────┐
│ 🌐 Title              domain.com   2d ago   │
└─────────────────────────────────────────────┘
         ↓ hover
┌─────────────────────────────────────────────┐
│ React is a library for building user        │
│ interfaces with reusable components.        │
└─────────────────────────────────────────────┘
```

## Convex Hooks

```typescript
// In EditBookmarkDialog
const generateDescription = useAction(api.metadata.generateBookmarkDescription);
const updateBookmark = useMutation(api.bookmarks.updateBookmarkDetails);
```

## Keyboard Shortcuts

- `⌘E` (or `Ctrl+E`) - Open Edit dialog

## Shadcn Components Used

- `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter`
- `Input` - Title and URL fields
- `Textarea` - Description field
- `Button` - Action buttons
- `Tooltip` - Description hover preview
- `Label` - Field labels

## Flow Diagram

```
User clicks "Generate with AI"
              │
              ▼
    [Set loading state]
              │
              ▼
    [Call generateBookmarkDescription]
              │
              ├─► Success
              │     │
              │     ▼
              │   [Set description]
              │   [Clear loading]
              │
              ├─► Skyra Quota Error
              │     │
              │     ▼
              │   [Show toast: "Daily limit reached"]
              │   [Clear loading]
              │
              └─► Other Error
                    │
                    ▼
                  [Show toast: "Failed to generate"]
                  [Clear loading]
```

## States

| State      | UI                                        |
| ---------- | ----------------------------------------- |
| Idle       | "✨ Generate with AI" button enabled      |
| Generating | Button disabled, shows "⏳ Generating..." |
| Success    | Description populated in textarea         |
| Error      | Toast notification, button reset to idle  |

## Future Enhancements (Not in Scope)

- Auto-generate on bookmark creation
- Batch edit descriptions
- Description search/filter
- Character count warning at 80%

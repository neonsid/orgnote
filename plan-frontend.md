# Frontend Implementation Plan

## Overview

This document outlines the frontend implementation for adding bookmark descriptions with AI generation support.

## User Flow

1. User right-clicks a bookmark → Context menu appears
2. User clicks "Edit..." → Dialog opens
3. Dialog shows:
   - Title input (editable)
   - URL input (editable)
   - Description textarea (max 150 chars = ~20 words)
   - "✨ Generate with AI" button
   - "Save" and "Cancel" buttons
4. User can:
   - Manually type description
   - Or click "Generate with AI" to auto-fill
   - Edit the generated description
   - Save changes

## New Files

### 1. `components/dashboard/edit-bookmark-dialog.tsx`

Main dialog component for editing bookmark details.

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

**Features:**

- Title input (shadcn `Input`)
- URL input (shadcn `Input`)
- Description textarea (shadcn `Textarea`, 3 rows, max 150 chars)
- Character counter for description
- "✨ Generate with AI" button (shadcn `Button` variant="outline")
  - Shows loading spinner while generating
  - Disabled during generation
- "Save" button (shadcn `Button`)
- "Cancel" button (shadcn `Button` variant="outline")

**Form Validation:**

- Title: required, max 200 chars
- URL: valid URL format
- Description: optional, max 150 chars (~20 words)

### 2. Updated `lib/validation.ts`

Add validation schema:

```typescript
export const editBookmarkSchema = z.object({
  title: bookmarkTitleSchema,
  url: z.string().url("Please enter a valid URL"),
  description: z
    .string()
    .max(150, "Description must be at most 150 characters")
    .optional(),
});

export type EditBookmarkFormData = z.infer<typeof editBookmarkSchema>;
```

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

### `components/dashboard/bookmark-list/menu.tsx`

Add context menu item:

- Desktop: "Edit..." with keyboard shortcut
- Mobile: "Edit..." button

**Menu Order:**

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

- Add `EditBookmarkDialog` component
- Add `openEditBookmarkDialog` handler
- Wire up `updateBookmarkDetails` mutation
- Add import for dialog

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

- If bookmark has description, show tooltip on hover
- Use shadcn `Tooltip` component
- Position: bottom or right of bookmark row

## UI Design

### Dialog Layout

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
│  Description (max 20 words)                 │
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
[⏳ Generating...]  ← Button shows spinner + text
```

### Error State

If AI generation fails:

- Show toast error: "Failed to generate description. Please try again."
- Button returns to normal state

### Success State

When description generated:

- Textarea populated with generated text
- Button returns to normal state
- Character counter updates

## Keyboard Shortcuts

- `⌘E` (or `Ctrl+E`) - Open Edit dialog for hovered/selected bookmark
- Existing shortcuts remain unchanged

## Hover Tooltip (Description Preview)

When bookmark has description:

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

## Shadcn Components Used

- `Dialog` - Main dialog container
- `DialogContent` - Dialog body
- `DialogHeader` - Title area
- `DialogTitle` - "Edit Bookmark" title
- `DialogFooter` - Button container
- `Input` - Title and URL fields
- `Textarea` - Description field
- `Button` - Action buttons
- `Tooltip` - Description hover preview
- `Label` - Field labels

## Convex Hooks

```typescript
// Mutation for saving bookmark details
const updateBookmark = useMutation(api.bookmarks.updateBookmarkDetails);

// Action for generating description
const generateMetadata = useAction(api.metadata.generateBookmarkMetadata);
```

## Loading States

- Form submission: Disable save button, show spinner
- AI generation: Disable generate button, show "Generating..." text
- Dialog close: Reset form state

## Future Enhancements

- Auto-generate description on bookmark creation (optional user setting)
- Description search/filter
- Batch edit descriptions
- Character count warning at 80% (120 chars)

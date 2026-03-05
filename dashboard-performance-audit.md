# Dashboard Performance Audit and Refactor Plan

Date: 2026-03-06

## Scope

This audit focuses on:

- `components/dashboard/**`
- project-wide `useMemo` / `useCallback` usage patterns
- data-fetching bottlenecks affecting dashboard responsiveness
- icon import consistency (`lucide-react` vs `lucide-react/dist/...`)
- feasibility and strategy for TanStack Query integration

---

## 1) Hook Usage Hotspots

### `components/dashboard/**` hook concentration

Counts below represent **actual hook calls** (not import statements).

#### `useState` (highest first)

- `components/dashboard/user-info.tsx`: 4
- `components/dashboard/edit-bookmark-dialog.tsx`: 2
- `components/dashboard/settings/index.tsx`: 2
- `components/dashboard/index.tsx`: 1
- `components/dashboard/bookmark-list/index.tsx`: 2
- `components/dashboard/bookmark-list/bookmark-item.tsx`: 1
- `components/dashboard/export-bookmarks-dialog.tsx`: 1
- `components/dashboard/filter-dropdown.tsx`: 1
- `components/dashboard/group-selector.tsx`: 1
- `components/dashboard/bookmark-search.tsx`: 1

#### `useEffect` (highest first)

- `components/dashboard/rename-bookmark-dialog.tsx`: 2
- `components/dashboard/user-info.tsx`: 2
- `components/dashboard/index.tsx`: 1
- `components/dashboard/bookmark-list/bookmark-item.tsx`: 1
- `components/dashboard/bookmark-list/use-bookmark-shortcuts.ts`: 1
- `components/dashboard/bookmark-search.tsx`: 1
- `components/dashboard/edit-bookmark-dialog.tsx`: 1
- `components/dashboard/export-bookmarks-dialog.tsx`: 1
- `components/dashboard/settings/index.tsx`: 1

#### `useCallback` (highest first)

- `components/dashboard/index.tsx`: 7
- `components/dashboard/edit-bookmark-dialog.tsx`: 5
- `components/dashboard/bookmark-list/index.tsx`: 3
- `components/dashboard/bookmark-list/bookmark-item.tsx`: 2
- `components/dashboard/bookmark-search.tsx`: 2
- `components/dashboard/bookmark-list/menu.tsx`: 1
- `components/dashboard/bookmark-list/use-bookmark-shortcuts.ts`: 1
- `components/dashboard/delete-group-dialog.tsx`: 1
- `components/dashboard/delete-bookmark-dialog.tsx`: 1

#### `useMemo`

- `components/dashboard/bookmark-list/menu.tsx`: 2
- `components/dashboard/edit-bookmark-dialog.tsx`: 1
- `components/dashboard/export-bookmarks-dialog.tsx`: 1

### Project-wide memoization snapshot

- `useMemo(...)` total calls: **12**
- `useCallback(...)` total calls: **36**

Observation: there is a strong bias toward `useCallback`, including several handlers where function identity stability likely does not pay for itself.

---

## 2) Bottlenecks Identified

## A. N+1 query pattern in dashboard data loading

File: `convex/bookmarks.ts`

- `getDashboardData` fetches user groups, then loops each group and runs a bookmarks query per group.
- This creates a query count proportional to number of groups and increases cold-load latency.

## B. Heavy client-side transformation in `useDashboardData`

File: `hooks/use-dashboard-data.ts`

- Filters all bookmarks by selected group on client.
- Recomputes domain, favicon URL, fallback color, and date formatting for every transformed bookmark.
- This is manageable for small sets but scales poorly with large bookmark volume.

## C. Inline per-item closures in list rendering

File: `components/dashboard/bookmark-list/index.tsx`

- Many handlers are recreated per row (`onCopy`, `onRename`, `onDelete`, etc. via inline lambdas).
- This reduces effectiveness of `memo` on children.

## D. Export dialog loads data too early

File: `components/dashboard/export-bookmarks-dialog.tsx`

- Queries for groups and all bookmarks execute when component is mounted, even if export dialog is closed.
- Should be gated by `open` state.

## E. Misc effect/state churn

Files:

- `components/dashboard/user-info.tsx`
- `components/dashboard/rename-bookmark-dialog.tsx`

Patterns include effect-based synchronization/reset logic that can be simplified to reduce incidental re-renders.

---

## 3) Lucide Import Consistency Audit

Current state:

- Files importing from public API `lucide-react`: **14**
- Files importing deep path `lucide-react/dist/esm/icons/*`: **20**

### Recommended standard (mandatory)

Use only:

```ts
import { IconName } from "lucide-react";
```

Reasoning:

- `lucide-react` is the public, stable API.
- `dist/esm/icons/*` is internal package structure and can break on package changes.
- Next.js/Turbopack already handles tree-shaking for named icon imports.

---

## 4) TanStack Query Integration Assessment

The project already has:

- `@tanstack/react-query`
- `providers/query-provider.tsx`
- active usage in `hooks/use-has-password.ts`

Dashboard currently uses Convex `useQuery/useMutation` for real-time data (`groups/bookmarks`), which is appropriate.

### Recommended architecture

- Keep Convex hooks for real-time collaborative data and subscriptions.
- Use TanStack Query for:
  - non-Convex HTTP/auth calls
  - expensive one-off background fetches
  - cache/invalidation for REST-like endpoints

This hybrid model gives real-time behavior where needed and avoids over-migrating dashboard state management.

---

## 5) Code Fix Snippets (Drop-in Patterns)

## Snippet A: Gate export queries by dialog open state

Target: `components/dashboard/export-bookmarks-dialog.tsx`

```tsx
const groups = useQuery(api.groups.list, open ? { userId } : "skip");
const allBookmarks = useQuery(
  api.bookmarks.getAllUserBookmarks,
  open ? { userId } : "skip",
);
```

Impact:

- prevents background data work until user opens export flow
- reduces initial dashboard load cost

## Snippet B: Remove low-value `useMemo` for cheap derivation

Target: `components/dashboard/export-bookmarks-dialog.tsx`

```tsx
const allGroupIds = new Set((groups ?? []).map((g) => g._id));
```

Use `useMemo` only if profiling shows this set creation is genuinely hot.

## Snippet C: Prefer event dispatchers over inline row lambdas

Target: `components/dashboard/bookmark-list/index.tsx`

```tsx
const onAction = useCallback(
  (type: "copy" | "rename" | "edit" | "delete", bookmark: Bookmark) => {
    switch (type) {
      case "copy":
        onCopy(bookmark);
        break;
      case "rename":
        onRename(bookmark);
        break;
      case "edit":
        onEdit(bookmark);
        break;
      case "delete":
        onDelete(bookmark);
        break;
    }
  },
  [onCopy, onRename, onEdit, onDelete],
);
```

Then pass stable function props and item ids where possible rather than per-item closures.

## Snippet D: Simplify callback overuse in leaf dialogs

Target: `components/dashboard/delete-bookmark-dialog.tsx`

```tsx
async function handleConfirm() {
  if (!bookmark || !userId) return;
  await deleteBookmark({
    bookmarkId: bookmark.id as Id<"bookmarks">,
    userId,
  });
  onOpenChange(false);
}
```

`useCallback` is unnecessary here unless passed to memoized children.

## Snippet E: Server-side query optimization pattern (parallelized)

Target: `convex/bookmarks.ts` (`getDashboardData`)

```ts
const groups = await ctx.db
  .query("groups")
  .withIndex("by_user_provided_id", (q) => q.eq("userProvidedId", args.userId))
  .order("desc")
  .collect();

const bookmarkLists = await Promise.all(
  groups.map((group) =>
    ctx.db
      .query("bookmarks")
      .withIndex("by_group_created", (q) => q.eq("groupId", group._id))
      .order("desc")
      .collect(),
  ),
);

const bookmarks = bookmarkLists.flat().map((b) => ({
  _id: b._id,
  title: b.title,
  url: b.url,
  description: b.description,
  doneReading: b.doneReading,
  createdAt: b.createdAt,
  groupId: b.groupId,
}));

return { groups, bookmarks };
```

This removes sequential group-by-group querying.

## Snippet F: Enforce Lucide import rule in ESLint

Target: `eslint.config.mjs`

```js
{
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: ["lucide-react/dist/*"],
        paths: [
          {
            name: "lucide-react/dist/esm/icons",
            message:
              "Use named imports from 'lucide-react' to keep icon imports consistent.",
          },
        ],
      },
    ],
  },
}
```

## Snippet G: Canonical icon import examples

```tsx
import { Loader2, Trash2, Check, Sparkles } from "lucide-react";
```

Replace deep imports like:

```tsx
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
```

---

## 6) Actionable Refactor Plan

### Phase 1 - High ROI / Low risk

1. Gate export dialog queries by `open` state.
2. Reduce low-value `useCallback` in leaf components/dialogs.
3. Normalize icon imports to `lucide-react`.
4. Add ESLint restriction to prevent deep Lucide imports.

### Phase 2 - Data-path performance

1. Refactor `getDashboardData` to remove sequential per-group queries.
2. Reduce client transform pressure in `useDashboardData` by moving cheap derivations closer to server response where practical.

### Phase 3 - Render stability

1. Reduce per-item inline closures in `BookmarkList`.
2. Re-profile `BookmarkItem` render counts after callback cleanup.
3. Keep `memo` only where profiler confirms win.

### Phase 4 - TanStack Query rationalization

1. Keep Convex for real-time groups/bookmarks.
2. Move non-realtime async flows to TanStack Query.
3. Standardize query keys and invalidation policy.

---

## 7) Expected Outcome

- Lower initial dashboard latency and fewer unnecessary background requests.
- Reduced render churn in list-heavy UI paths.
- Cleaner hook usage with fewer defensive callbacks.
- Enforced icon import consistency across the codebase.
- Clear separation between real-time (Convex) and non-realtime (TanStack Query) state.

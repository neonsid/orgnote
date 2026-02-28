# Codebase Scaling & Refactoring Plan

## Summary

This plan addresses two main concerns in the Goldfish codebase:

1. **Large file decomposition** - 3 files exceed 400 lines, with 1 over 800 lines
2. **useState/useEffect proliferation** - Multiple components have excessive state management

**Tools to be added:**

- **Zustand** - For global state management (dialog states, UI state)
- **TanStack Query (React Query)** - For server state management, caching, and data fetching

---

## 1. Large File Breakdown

### 1.1 `components/dashboard/user-settings-dialog.tsx` (818 lines) 🔴 CRITICAL

**Issues:**

- Manages 3 different forms (name, password, public profile)
- Contains 6 useState declarations
- Has 3 useEffect hooks
- Mixes UI, business logic, and form handling

**Refactoring Strategy:**

```
components/dashboard/settings/
├── index.tsx                    # Main dialog shell (150 lines)
├── settings-tabs.tsx            # Tab navigation component (80 lines)
├── general-settings.tsx         # General tab content (200 lines)
├── public-profile-settings.tsx  # Public profile tab content (200 lines)
├── password-section.tsx         # Password change section (180 lines)
├── use-settings-forms.ts        # Hook for form management (100 lines)
└── types.ts                     # Shared types
```

**Actions:**

1. Extract each tab into its own component
2. Move form logic into custom hooks (`useNameForm`, `usePasswordForm`, `useProfileForm`)
3. Create a `usePasswordCheck` hook using TanStack Query to replace the useEffect
4. Move `PasswordRequirement` and `PasswordInput` to `components/ui/`

---

### 1.2 `components/dashboard/bookmark-list.tsx` (622 lines) 🟡 HIGH

**Issues:**

- Mixes list rendering, context menus, and mobile popover logic
- Contains animation variants inline
- Has both mobile and desktop variants in one file

**Refactoring Strategy:**

```
components/dashboard/bookmark-list/
├── index.tsx                    # Main list component (200 lines)
├── bookmark-item.tsx            # Individual bookmark row (100 lines)
├── bookmark-menu/
│   ├── index.tsx                # Menu wrapper (80 lines)
│   ├── desktop-menu.tsx         # Context menu version (80 lines)
│   └── mobile-menu.tsx          # Popover version (80 lines)
├── favicon-icon.tsx             # Favicon component with fallback (50 lines)
├── use-bookmark-shortcuts.ts    # Keyboard shortcuts hook (60 lines)
└── constants.ts                 # Animation variants, keyboard shortcuts
```

**Actions:**

1. Extract `BookmarkItem` as a separate memoized component
2. Split menu content into desktop (ContextMenu) and mobile (Popover) variants
3. Move animation variants to a constants file
4. Extract keyboard shortcut handling into a custom hook
5. Move `FaviconIcon` to its own file

---

### 1.3 `components/dashboard/index.tsx` (418 lines) 🟡 MEDIUM

**Issues:**

- Dashboard page with header, filter, and list logic
- Contains `DashboardHeader` and `FilterDropdown` inline
- Multiple state declarations

**Refactoring Strategy:**

```
components/dashboard/
├── index.tsx                    # Main dashboard page (200 lines)
├── dashboard-header.tsx         # Extract existing component (120 lines)
├── filter-dropdown.tsx          # Extract existing component (60 lines)
├── use-dashboard-state.ts       # Consolidated state hook (80 lines)
└── bookmark-container.tsx       # Bookmark list with search/filter (100 lines)
```

**Actions:**

1. Extract `DashboardHeader` and `FilterDropdown` to separate files (already memoized)
2. Create a `useDashboardState` hook to consolidate the 7 useState calls
3. Move bookmark filtering logic into a `useFilteredBookmarks` hook

---

### 1.4 `components/landing/dashboard-demo.tsx` (245 lines) 🟢 LOW

**Issues:**

- Similar structure to main dashboard but for demo
- 8 useState declarations

**Note:** Landing and dashboard components will be kept separate as requested.

**Refactoring Strategy:**

```
components/landing/dashboard-demo/
├── index.tsx                    # Main demo component (120 lines)
├── use-demo-state.ts            # Consolidated demo state hook (100 lines)
└── demo-bookmark-actions.ts     # Bookmark action handlers (50 lines)
```

---

## 2. Zustand Store Structure

```typescript
// stores/dialog-store.ts
interface DialogState {
  // Dialog visibility states
  renameBookmark: { open: boolean; bookmarkId: string | null };
  deleteBookmark: { open: boolean; bookmarkId: string | null };
  deleteGroup: { open: boolean; groupId: string | null };
  userSettings: { open: boolean; activeTab: "general" | "public-profile" };
  exportBookmarks: { open: boolean };
  createGroup: { open: boolean };

  // Actions
  openRenameDialog: (bookmarkId: string) => void;
  closeRenameDialog: () => void;
  openDeleteBookmarkDialog: (bookmarkId: string) => void;
  closeDeleteBookmarkDialog: () => void;
  // ... etc
}
```

---

## 3. TanStack Query Integration

### Queries to migrate:

| Current                             | New Hook                         | Purpose                    |
| ----------------------------------- | -------------------------------- | -------------------------- |
| useEffect + authClient.listAccounts | useHasPassword                   | Check if user has password |
| useEffect + profile fetch           | useProfile                       | Get user profile           |
| Manual mutation handling            | useUpdateName, useUpdatePassword | Form submissions           |

### Query Keys Structure:

```typescript
["user", "password-check"][("user", "profile", userId)][
  ("bookmarks", "list", groupId)
][("bookmarks", "all", userId)][("groups", "list", userId)];
```

---

## 4. useState/useEffect Consolidation

### 4.1 Problematic Patterns Found

| File                                 | useState Count | useEffect Count | Issues                            |
| ------------------------------------ | -------------- | --------------- | --------------------------------- |
| `user-settings-dialog.tsx`           | 6              | 3               | Multiple forms, complex effects   |
| `dashboard/index.tsx`                | 7              | 0               | Dialog coordination, filter state |
| `landing/dashboard-demo.tsx`         | 8              | 0               | Demo state management             |
| `landing/landing-group-selector.tsx` | 5              | 0               | Dialog state proliferation        |

### 4.2 Solutions

#### Pattern 1: Dialog State with Zustand

**Before:**

```tsx
const [renameDialogOpen, setRenameDialogOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [exportOpen, setExportOpen] = useState(false);
```

**After:**

```tsx
const { renameBookmark, deleteBookmark, openRenameDialog, closeRenameDialog } =
  useDialogStore();
```

#### Pattern 2: Server State with TanStack Query

**Before:**

```tsx
const [hasPassword, setHasPassword] = useState(false);
useEffect(() => {
  if (open) {
    authClient.listAccounts().then((result) => {
      const credentialAccount = result.data?.find(
        (account) => account.providerId === "credential",
      );
      setHasPassword(!!credentialAccount);
    });
  }
}, [open]);
```

**After:**

```tsx
const { data: hasPassword } = useQuery({
  queryKey: ["user", "password-check"],
  queryFn: async () => {
    const result = await authClient.listAccounts();
    return result.data?.some((account) => account.providerId === "credential");
  },
  enabled: open,
});
```

---

## 5. Implementation Priority

### Phase 1: Setup & Dependencies (Day 1)

1. Install Zustand and TanStack Query
2. Set up QueryClientProvider
3. Create base Zustand store structure
4. Commit changes

### Phase 2: user-settings-dialog.tsx (Days 1-2)

1. Create directory structure
2. Extract PasswordInput and PasswordRequirement to ui/
3. Create usePasswordCheck hook with TanStack Query
4. Create useNameForm, usePasswordForm, useProfileForm hooks
5. Extract GeneralSettings component
6. Extract PublicProfileSettings component
7. Extract PasswordSection component
8. Refactor main dialog to use new components
9. Commit changes

### Phase 3: bookmark-list.tsx (Days 2-3)

1. Create directory structure
2. Move animation variants to constants.ts
3. Extract FaviconIcon component
4. Extract useBookmarkShortcuts hook
5. Extract BookmarkItem component
6. Extract BookmarkMenu components (desktop + mobile)
7. Refactor main list to use new components
8. Commit changes

### Phase 4: dashboard/index.tsx (Day 3)

1. Extract DashboardHeader to separate file
2. Extract FilterDropdown to separate file
3. Create useDashboardState hook
4. Create useFilteredBookmarks hook
5. Refactor main dashboard page
6. Commit changes

### Phase 5: Dialog Store Integration (Day 4)

1. Implement Zustand dialog store
2. Refactor dashboard to use dialog store
3. Refactor bookmark-list to use dialog store
4. Refactor group-selector to use dialog store
5. Commit changes

### Phase 6: Landing Components (Day 4-5)

1. Refactor landing/dashboard-demo with extracted patterns
2. Refactor landing/group-selector
3. Create useDemoState hook
4. Commit changes

### Phase 7: Testing & Polish (Day 5)

1. Test all refactored components
2. Run lint and typecheck
3. Verify no regression in functionality
4. Final commit

---

## 6. Expected Outcomes

| Metric                   | Before     | After      |
| ------------------------ | ---------- | ---------- |
| Largest file size        | 818 lines  | ~250 lines |
| Files >400 lines         | 3          | 0          |
| Avg component size       | ~200 lines | ~120 lines |
| useState per file (avg)  | 4.2        | 2.1        |
| useEffect per file (avg) | 1.8        | 0.5        |
| Testability              | Low        | High       |

---

## 7. Implementation Notes

### Dependencies to Add:

```bash
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools
```

### Dev Dependencies:

```bash
pnpm add -D @tanstack/eslint-plugin-query
```

### File Naming Convention:

- Components: PascalCase (e.g., `GeneralSettings.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSettingsForms.ts`)
- Utilities: camelCase (e.g., `constants.ts`)
- Types: camelCase (e.g., `types.ts`)

### Directory Structure Rules:

- Each major feature gets its own directory
- Shared components stay in `components/ui/`
- Hooks go in `hooks/` or co-located with components
- Stores go in `stores/`

---

## 8. Commit Strategy

Each phase will be committed separately:

```
Phase 1: deps: add zustand and tanstack query
Phase 2: refactor: break down user-settings-dialog into components
Phase 3: refactor: modularize bookmark-list component
Phase 4: refactor: extract dashboard sub-components
Phase 5: feat: add dialog state management with zustand
Phase 6: refactor: clean up landing demo components
Phase 7: test: verify refactoring and fix any issues
```

---

_Plan created: 2026-02-28_
_Estimated effort: 5 days_
_Status: Ready for implementation_

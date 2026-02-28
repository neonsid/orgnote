# Component Structure Documentation

## Overview

This document maps all components to their respective code locations after the refactoring.

---

## Dashboard Components

### Main Dashboard

**Location:** `components/dashboard/index.tsx`
**Lines:** ~200
**Contains:**

- Main dashboard page component
- Session management and authentication checks
- Group/bookmark data fetching with Convex
- Bookmark filtering logic (search + read/unread filters)
- Dialog coordination via Zustand store
- Handlers: copy, rename, delete, move, toggle read status

### Dashboard Header

**Location:** `components/dashboard/dashboard-header.tsx`
**Lines:** ~60
**Contains:**

- Logo and navigation
- Group selector integration
- Theme toggle (desktop only)
- User info dropdown

### Filter Dropdown

**Location:** `components/dashboard/filter-dropdown.tsx`
**Lines:** ~70
**Contains:**

- Filter type selection (all/read/unread)
- Popover with filter options
- Icons for each filter state

### Group Selector

**Location:** `components/dashboard/group-selector.tsx`
**Lines:** ~180
**Contains:**

- Group selection dropdown
- Create group button
- Delete group button
- Dialog integration via Zustand store

---

## Settings Components

### Settings Dialog (Main)

**Location:** `components/dashboard/settings/index.tsx`
**Lines:** ~150
**Contains:**

- Dialog shell with tabs
- Tab navigation (General / Public Profile)
- Save/Cancel actions
- Form submission coordination
- Export dialog integration

### General Settings Tab

**Location:** `components/dashboard/settings/general-settings.tsx`
**Lines:** ~130
**Contains:**

- Profile picture upload (placeholder)
- Name field with form integration
- Email display (read-only)
- Password section integration
- Export bookmarks button

### Public Profile Settings Tab

**Location:** `components/dashboard/settings/public-profile-settings.tsx`
**Lines:** ~170
**Contains:**

- Public profile toggle
- Username field with validation
- Bio textarea
- GitHub URL field
- X/Twitter username field
- Website field
- Copy profile link button
- Preview profile button

### Password Section

**Location:** `components/dashboard/settings/password-section.tsx`
**Lines:** ~110
**Contains:**

- Current password field
- New password field with requirements
- Confirm password field
- Password requirement checklist
- Update password button

### Settings Types

**Location:** `components/dashboard/settings/types.ts`
**Lines:** ~10
**Contains:**

- UserSettingsUser interface
- SettingsTab type

---

## Bookmark List Components

### Bookmark List (Main)

**Location:** `components/dashboard/bookmark-list/index.tsx`
**Lines:** ~115
**Contains:**

- List container with AnimatePresence
- Loading shimmer state
- Empty state handling
- Touch event handling (mobile long-press)
- Keyboard shortcuts integration

### Bookmark Item

**Location:** `components/dashboard/bookmark-list/bookmark-item.tsx`
**Lines:** ~140
**Contains:**

- Individual bookmark row
- Favicon icon
- Title and domain display
- Date formatting
- Keyboard shortcut hints on hover
- Desktop (ContextMenu) and Mobile (Popover) variants

### Menu Components

**Location:** `components/dashboard/bookmark-list/menu.tsx`
**Lines:** ~180
**Contains:**

- **DesktopMenu:** Context menu with submenus
  - Mark as read/unread
  - Copy URL
  - Rename
  - Move to group (submenu)
  - Delete (destructive)
- **MobileMenu:** Popover menu for touch devices
  - Same actions as desktop
  - Hover-based submenu for groups
- Keyboard shortcut display

### Favicon Icon

**Location:** `components/dashboard/bookmark-list/favicon-icon.tsx`
**Lines:** ~45
**Contains:**

- Favicon image with error handling
- Fallback color letter
- Read status overlay (checkmark)

### Bookmark List Constants

**Location:** `components/dashboard/bookmark-list/constants.ts`
**Lines:** ~45
**Contains:**

- Keyboard shortcuts mapping
- Animation variants (container, item, header)
- Date formatting utility

### Bookmark List Types

**Location:** `components/dashboard/bookmark-list/types.ts`
**Lines:** ~15
**Contains:**

- Bookmark interface

### Keyboard Shortcuts Hook

**Location:** `components/dashboard/bookmark-list/use-bookmark-shortcuts.ts`
**Lines:** ~50
**Contains:**

- Cmd/Ctrl+Enter: Open bookmark
- Cmd/Ctrl+E: Rename bookmark
- Cmd/Ctrl+Backspace: Delete bookmark
- Hovered bookmark tracking

---

## Dialog Components

### Rename Bookmark Dialog

**Location:** `components/dashboard/rename-bookmark-dialog.tsx`
**Lines:** ~80
**Contains:**

- Title input form
- Form validation
- Convex mutation for rename
- Cancel/Confirm actions

### Delete Bookmark Dialog

**Location:** `components/dashboard/delete-bookmark-dialog.tsx`
**Lines:** ~65
**Contains:**

- Confirmation message with bookmark title
- Cancel button
- Delete (destructive) button
- Convex mutation for deletion

### Create Group Dialog

**Location:** `components/dashboard/create-group-dialog.tsx`
**Lines:** ~120
**Contains:**

- Group name input
- Color picker
- Form validation
- Convex mutation for creation

### Delete Group Dialog

**Location:** `components/dashboard/delete-group-dialog.tsx`
**Lines:** ~90
**Contains:**

- Confirmation message with group name
- Warning about associated bookmarks
- Cancel button
- Delete (destructive) button
- Convex mutation for deletion

### Export Bookmarks Dialog

**Location:** `components/dashboard/export-bookmarks-dialog.tsx`
**Lines:** ~350
**Contains:**

- Group selection dropdown (multi-select)
- Format selection (JSON/CSV)
- Bookmark count display
- Export generation
- File download logic

### Keyboard Shortcuts Dialog

**Location:** `components/dashboard/keyboard-shortcuts-dialog.tsx`
**Lines:** ~80
**Contains:**

- List of keyboard shortcuts
- Visual key representations
- Shortcut descriptions

---

## UI Components

### Password Input

**Location:** `components/ui/password-input.tsx`
**Lines:** ~85
**Contains:**

- Password input with toggle visibility
- Eye/EyeOff icons
- Password requirement display
- Individual requirement items (check/x)

---

## Custom Hooks

### useHasPassword

**Location:** `hooks/use-has-password.ts`
**Lines:** ~15
**Contains:**

- TanStack Query hook
- Checks if user has password-based auth
- Uses authClient.listAccounts()

### useNameForm

**Location:** `hooks/use-name-form.ts`
**Lines:** ~25
**Contains:**

- TanStack Form configuration for name updates
- Validation schema integration
- Submission handler

### usePasswordForm

**Location:** `hooks/use-password-form.ts`
**Lines:** ~60
**Contains:**

- TanStack Form configuration for password change
- Field error state management
- Error message mapping from authClient
- Toast notifications

### usePublicProfileForm

**Location:** `hooks/use-public-profile-form.ts`
**Lines:** ~105
**Contains:**

- TanStack Form configuration for profile
- Links array building (GitHub, Twitter, Portfolio)
- Existing profile data loading via useEffect
- Convex mutation for upsert

### useBookmarkShortcuts

**Location:** `hooks/use-bookmark-shortcuts.ts` (co-located in bookmark-list/)
**Lines:** ~50
**Contains:**

- Keyboard event listeners
- Meta/Ctrl key detection
- Action dispatching (open, rename, delete)

---

## State Management

### Dialog Store (Zustand)

**Location:** `stores/dialog-store.ts`
**Lines:** ~95
**Contains:**

- Dialog state for:
  - Rename bookmark (open, bookmarkId)
  - Delete bookmark (open, bookmarkId)
  - Delete group (open, groupId)
  - User settings (open, activeTab)
  - Export bookmarks (open)
  - Create group (open)
- Actions: openX, closeX, setTab

---

## Utilities

### Domain Utils

**Location:** `lib/domain-utils.ts`
**Lines:** ~20
**Contains:**

- extractDomain(): URL parsing utility
- COLORS: Color palette array for bookmarks

### Validation

**Location:** `lib/validation.ts`
**Contains:**

- Zod schemas for forms:
  - updateNameSchema
  - changePasswordSchema
  - publicProfileSchema

---

## Providers

### Query Provider

**Location:** `providers/query-provider.tsx`
**Lines:** ~25
**Contains:**

- TanStack Query client configuration
- Default query options (staleTime, refetchOnWindowFocus)
- DevTools integration

---

## Landing Page Components

### Dashboard Demo

**Location:** `components/landing/dashboard-demo.tsx`
**Lines:** ~245
**Contains:**

- Interactive demo of dashboard
- Local state for demo bookmarks
- Demo group management
- Mock handlers (copy, rename, delete, move)

### Landing Bookmark List

**Location:** `components/landing/bookmark-list.tsx`
**Lines:** ~355
**Contains:**

- Demo bookmark list rendering
- Mobile-optimized popover menus
- Local state management
- No keyboard shortcuts

### Landing Group Selector

**Location:** `components/landing/landing-group-selector.tsx`
**Lines:** ~220
**Contains:**

- Demo group selector
- Create group functionality
- Color picker
- Local state only

---

## File Count Summary

| Category                 | Count   |
| ------------------------ | ------- |
| Dashboard Components     | 12      |
| Settings Components      | 5       |
| Bookmark List Components | 7       |
| Dialog Components        | 6       |
| Landing Components       | 3       |
| Custom Hooks             | 5       |
| UI Components            | 1 (new) |
| State Management         | 1       |
| Providers                | 1       |
| Utilities                | 2       |
| **Total**                | **43**  |

---

## Lines of Code Summary

| Component Type        | Before    | After    | Change     |
| --------------------- | --------- | -------- | ---------- |
| user-settings-dialog  | 818       | ~200     | -618       |
| bookmark-list         | 622       | ~150     | -472       |
| dashboard/index       | 418       | ~200     | -218       |
| **Total Large Files** | **1,858** | **~550** | **-1,308** |

---

_Documentation generated: 2026-02-28_

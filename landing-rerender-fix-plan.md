# Landing Page Re-render Reduction Plan

Date: 2026-03-06

## Goal

Reduce unnecessary React re-renders across the landing demo (`components/landing/**`) so that:

- typing in search updates only search + list regions,
- group selector and rename dialog stay stable during unrelated updates,
- list rows re-render only when their own data changes,
- frame drops from list animations/interactions are eliminated on low-end devices.

---

## Scope

Files in scope:

- `components/landing/dashboard-demo.tsx`
- `components/landing/bookmark-list.tsx`
- `components/landing/landing-group-selector.tsx`
- `components/landing/rename-bookmark-dialog.tsx`
- `components/dashboard/bookmark-search.tsx` (integration touchpoints only)

Out of scope for this pass:

- backend persistence changes,
- feature additions,
- visual redesign.

---

## Known Re-render Drivers (Current State)

1. **State ownership too high in tree**
   - `DashboardDemo` owns query, group, bookmark mutation, and dialog state.
   - Any state update can force broad subtree reconciliation.

2. **Callback identity churn from closure dependencies**
   - `handleMove` and `handleRenameConfirm` depend on arrays (`tempBookmarks`, `allGroups`) that change often.
   - New callback references reduce effectiveness of memoized children.

3. **Per-render list computation cost**
   - `allBookmarks` reconstructs arrays from `Map` + `tempBookmarks` filtering each time dependencies change.
   - `filteredBookmarks` scans current list on each debounced query update.

4. **Per-item inline functions in list rows**
   - Lambdas inside `bookmarks.map` generate new functions per row per render.
   - `MenuContent` and row structures receive unstable props.

5. **Animation orchestration during high-frequency updates**
   - `AnimatePresence` + row motion wrappers run during query updates.
   - This increases commit and layout work.

6. **Mixed mobile/desktop branching inside a hot map path**
   - Conditional branch `isSmallMobile ? ... : ...` repeats for every row.

---

## Success Criteria

1. Search typing does not re-render:
   - `LandingGroupSelector`
   - `LandingRenameBookmarkDialog` internals (when closed)

2. Group switching re-renders only:
   - group selector active state,
   - list container and affected rows.

3. Row actions (rename/move/delete) re-render only affected rows + minimal container updates.

4. React Profiler comparison (before vs after):
   - > =40% reduction in commit count during a 10-character search input sequence.
   - > =30% reduction in total render duration for same sequence.

5. No behavior regressions in:
   - keyboard shortcuts,
   - context menu actions,
   - rename dialog flow,
   - mobile and desktop row rendering.

---

## Implementation Plan

## Phase 0 — Baseline Profiling (No refactor yet)

### Tasks

1. Add temporary render counters (`console.count`) in dev builds for:
   - `DashboardDemo`
   - `LandingBookmarkList`
   - `LandingGroupSelector`
   - `LandingRenameBookmarkDialog`

2. Capture React DevTools Profiler traces for:
   - typing search query (10 chars),
   - switching group,
   - move action from context menu,
   - rename confirm.

3. Record baseline metrics in this file under “Profiler Notes” section.

### Deliverable

- Verified hot paths with numbers instead of assumptions.

---

## Phase 1 — Partition `DashboardDemo` by state domain

### Refactor target

`components/landing/dashboard-demo.tsx`

### Tasks

1. Split monolithic component into memoized child boundaries:
   - `LandingDemoHeader` (group selection only)
   - `LandingDemoSearch` (search input and callbacks)
   - `LandingDemoListPane` (computed list + row actions)
   - `LandingDemoRenameHost` (dialog state only)

2. Move dialog-local state (`renameDialogOpen`, selected bookmark draft) into `LandingDemoRenameHost` so search typing does not invalidate dialog subtree.

3. Keep top-level source-of-truth state only where unavoidable:
   - bookmark entities,
   - selected group id,
   - query value.

4. Wrap child boundaries with `memo` and pass only minimal props.

### Expected impact

- Search updates stop propagating to selector/dialog areas.

---

## Phase 2 — Stabilize callbacks and prop identity

### Refactor targets

- `components/landing/dashboard-demo.tsx`
- `components/landing/bookmark-list.tsx`

### Tasks

1. Convert handlers to functional updates to remove array/object deps from callbacks:
   - `handleRenameConfirm`
   - `handleMove`

2. Replace closure-heavy lookup logic with id-based helpers:
   - keep a stable `getGroupNameById` helper memoized from `allGroups`.

3. Ensure stable prop references into list:
   - `onCopy`, `onRename`, `onDelete`, `onMove` must not change unless behavior changes.

4. Avoid passing newly created object literals as props in hot render paths.

### Expected impact

- `memo` on list/rows starts producing real savings.

---

## Phase 3 — Reshape bookmark data for cheap reads

### Refactor target

`components/landing/dashboard-demo.tsx`

### Tasks

1. Replace dual storage pattern (`tempBookmarks` + `bookmarksMap`) with a single normalized store shape (id-keyed + ordered ids) or a single array with immutable updates.

2. Build group index once per data-version increment:
   - `bookmarksByGroupId: Map<string, string[]>` (id lists)

3. Maintain pre-normalized search fields when writing bookmarks:
   - `searchTitle`
   - `searchDomain`

4. Filter only current group ids, then map ids to entities.

### Expected impact

- Lower CPU during typing and group switching.

---

## Phase 4 — Optimize list row rendering path

### Refactor target

`components/landing/bookmark-list.tsx`

### Tasks

1. Extract row components:
   - `LandingBookmarkRowDesktop`
   - `LandingBookmarkRowMobile`

2. Memoize rows with explicit prop equality (or stable primitive prop strategy).

3. Replace inline row lambdas with stable handlers:
   - pass `bookmarkId` and dispatch action from stable callback.

4. Precompute move-target groups once per render of list, not inside each row/menu when possible.

5. Keep `FaviconIcon` stable by passing primitives (`title`, `favicon`, `fallbackColor`) rather than full bookmark object if useful.

### Expected impact

- Large lists stop re-rendering every row on unrelated changes.

---

## Phase 5 — Animation containment and update-mode tuning

### Refactor target

`components/landing/bookmark-list.tsx`

### Tasks

1. Disable or simplify enter/exit animation while query is actively changing.

2. Restrict `AnimatePresence` to item insertion/removal events, not all text-filter transitions.

3. Keep motion wrappers at list level where possible to reduce per-row motion work.

4. Verify no visual regressions on both desktop and small mobile branches.

### Expected impact

- Smoother typing and fewer layout/repaint spikes.

---

## Phase 6 — Selector and dialog isolation hardening

### Refactor targets

- `components/landing/landing-group-selector.tsx`
- `components/landing/rename-bookmark-dialog.tsx`

### Tasks

1. Wrap selector in `memo` and ensure incoming props are stable from parent.

2. In rename dialog:
   - avoid effect churn when closed,
   - sync title only when `open && bookmark?.id` changes,
   - keep confirm handler stable.

3. Confirm closed dialog does not re-render on search input.

### Expected impact

- Reduced incidental updates outside list/search flow.

---

## Phase 7 — Validation and cleanup

### Tasks

1. Remove temporary render counters.

2. Re-run profiler scenarios from Phase 0 and record after-metrics.

3. Manual QA matrix:
   - desktop: search, create, rename, move, delete, keyboard shortcuts
   - mobile: tap/open links, list behavior, no menu regressions

4. Optional: run existing lint/type checks and ensure no warnings from new memo/equality logic.

### Deliverable

- Measured proof of rerender reduction + functional parity.

---

## Suggested Execution Order (Low Risk)

1. Phase 0 (measure)
2. Phase 1 (component boundaries)
3. Phase 2 (callback stability)
4. Phase 4 (row memoization)
5. Phase 3 (data shape improvements)
6. Phase 5 (animation tuning)
7. Phase 6 (selector/dialog hardening)
8. Phase 7 (final validation)

Reasoning: boundary + identity fixes give immediate wins and make later data/animation changes easier to validate.

---

## Risk Register

1. **Stale closures after callback refactor**
   - Mitigation: prefer functional state updates; add targeted interaction tests.

2. **Over-memoization complexity**
   - Mitigation: memoize only hot components verified by profiler.

3. **Animation behavior drift**
   - Mitigation: keep animation changes isolated and compare before/after interactions visually.

4. **Data model refactor bugs**
   - Mitigation: introduce refactor in small commits; preserve existing action semantics.

---

## Optional Stretch Improvements

1. Virtualize list (`@tanstack/react-virtual`) when bookmark count is high.
2. Move expensive domain/date formatting to write-time rather than render-time.
3. Add lightweight performance test script for regression detection (profiling checklist in CI docs).

---

## Profiler Notes

### Baseline (to fill)

- Search 10-char commit count:
- Search total render duration:
- Group switch commit count:
- Rename action commit count:

### After refactor (to fill)

- Search 10-char commit count:
- Search total render duration:
- Group switch commit count:
- Rename action commit count:

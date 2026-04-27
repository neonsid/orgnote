# Agent Rules

## Project skills

Extended, task-specific guidance lives under **`.agents/skills/`**. Read the relevant `SKILL.md` before deep work in that area:

| Area | Path | When to read |
| ---- | ---- | ------------ |
| Convex | `.agents/skills/convex/convex-best-practices/SKILL.md` | Backend functions, schema, queries, mutations, actions, Convex patterns |
| Frontend / React effects | `.agents/skills/frontend/use-effect/SKILL.md` | `useEffect`, side effects, subscriptions, replacing effects with declarative patterns, `useMountEffect` |
| Frontend / React props | `.agents/skills/frontend/large-react-prop-lists/SKILL.md` | Many props, wide component APIs, grouping props, splitting components, container vs presentational |

Add new skills under **`.agents/skills/<domain>/<skill-name>/SKILL.md`** (e.g. `convex/`, `frontend/`) so they stay grouped and discoverable.

## UI Components

- **ALWAYS use shadcn/ui components** when available
- If a shadcn component doesn't exist in the project, install it using:
  ```bash
  npx shadcn@latest add <component-name>
  ```
- Prefer shadcn components over custom implementations
- Common shadcn components to use:
  - `button` - Buttons
  - `input` - Text inputs
  - `textarea` - Multi-line text inputs
  - `switch` - Toggle switches
  - `dialog` - Modal dialogs
  - `label` - Form labels
  - `select` - Dropdown selects
  - `checkbox` - Checkboxes
  - `radio-group` - Radio button groups
  - `card` - Card containers
  - `tabs` - Tab navigation
  - `toast` from `@/lib/toast` (Base UI / Coss `ToastProvider`) - Notifications

- **ALWAYS use pnpm**

## React Hooks Best Practices

For **`useEffect`** and effect-heavy refactors, follow **`.agents/skills/frontend/use-effect/SKILL.md`** (declarative alternatives, `useMountEffect`, data fetching).

### Avoid Overusing Hooks

**useState:**

- Don't use state for derived values that can be computed from props or other state
- Avoid useState for simple constants or values that never change
- Consider using URL state for shareable/filter state instead of useState

**useEffect:**

- Avoid useEffect for simple event handlers - use direct callbacks instead
- Don't use useEffect to sync state from props - prefer controlled components
- Use React Query/TanStack Query for server state instead of useEffect + fetch
- Gate expensive queries by open/mount state to prevent background work

**useMemo:**

- Don't use useMemo for cheap computations (e.g., simple array filters, string operations)
- Only use when profiling shows a genuine performance issue
- React's default rendering is fast enough for most cases

**useCallback:**

- Avoid useCallback in leaf components that don't pass functions to memoized children
- Don't use useCallback for event handlers that are passed to native DOM elements
- Only use when functions are passed to React.memo children or dependency arrays
- Prefer stable function references via component structure over useCallback

### Preferred Patterns

```tsx
// Good: Direct function in leaf component
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  async function handleClick() {
    await onDelete();
  }
  return <button onClick={handleClick}>Delete</button>;
}

// Good: Gate expensive queries
const data = useQuery(api.data.get, open ? { userId } : "skip");

// Good: Simple derivation without useMemo
const filteredItems = items.filter((item) => item.active);

// Good: URL state for shareable state
const [filter, setFilter] = useQueryState("filter");
```

### When to Use Hooks

| Hook        | Use When                                    | Avoid When                               |
| ----------- | ------------------------------------------- | ---------------------------------------- |
| useState    | User input, UI state, local component state | Derived values, constants, server state  |
| useEffect   | Sync with external systems, subscriptions   | Event handling, simple data derivation   |
| useMemo     | Expensive calculations with same inputs     | Cheap operations, premature optimization |
| useCallback | Functions passed to memoized children       | Leaf components, DOM event handlers      |

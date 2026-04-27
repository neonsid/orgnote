---
name: expo-workflow
description: Expo / apps/mobile checks — after TypeScript or dependency changes, always run npx expo doctor from apps/mobile
---

# Expo mobile workflow

## Type checking and health

When you finish **verifying the Expo app** (`apps/mobile`)—after edits, `tsc`, or dependency bumps—do not stop at TypeScript alone.

1. Run TypeScript as usual (e.g. from `apps/mobile`: `pnpm exec tsc --noEmit`, or the monorepo’s `pnpm typecheck` if it includes mobile).

2. **Always** run **Expo Doctor** from the mobile app directory so SDK and `expo-*` package versions stay aligned:

   ```bash
   cd apps/mobile && npx expo doctor
   ```

3. If Doctor reports version mismatches, update the listed packages to the **expected** versions and re-run `pnpm install` (from the repo root in this monorepo) until `expo doctor` is clean (or only acceptable warnings remain).

Expo’s expected versions change with SDK releases; treat Doctor’s output as the source of truth for `expo` and related packages.

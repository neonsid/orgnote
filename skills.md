# Skills (agent guidance)

## This repo (local)

Task-specific instructions live under **`.agents/skills/`** — see the table in **[AGENTS.md](./AGENTS.md)** (Convex, React effects, large prop lists, etc.). Each skill is a **`SKILL.md`** in its folder.

## Expo & React Native (official)

When work touches **Expo, Expo Router, EAS, native modules, or mobile debugging** and local docs are not enough, use the **official Expo team skills**:

- **Repository:** [https://github.com/expo/skills](https://github.com/expo/skills)
- **Cursor:** Settings → **Rules & Command** → **Project Rules** → Add Rule → **Remote Rule (GitHub)** → `https://github.com/expo/skills.git`  
  Skills are picked up from context (e.g. building UI with Expo Router, API calls, App Store deployment).
- **Claude Code:** `/plugin marketplace add expo/skills` then `/plugin install expo`
- **Other agents:** `bunx skills add expo/skills` (per [Expo skills README](https://github.com/expo/skills))

Prefer these for Expo-specific APIs and workflows; keep using **`.agents/skills/`** for project conventions (Convex, hooks patterns, etc.).

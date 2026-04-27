# Orgnote

AI-powered bookmark manager: save links, get instant summaries, organize groups, and share public profiles. Includes a **vault** for uploads (images, PDFs, and more) backed by Cloudflare R2.

> **Package name:** `goldfish` (this repository / `package.json`).

## Features

- **AI summaries** — Descriptions for bookmarked URLs via OpenRouter
- **URL-aware extraction** — Different paths for X/Twitter (Scira), GitHub, and generic sites (Open Graph + AI)
- **Groups** — Color-coded bookmark collections (optional public visibility)
- **Public profiles** — `/u/[username]` with shared bookmarks
- **Vault** — File uploads with presigned URLs, thumbnails, and gallery UI (R2 storage)
- **Rate limits** — Daily caps on AI / Scira usage per user
- **Auth** — Clerk (Google OAuth, email, passwords) with Convex JWT validation
- **Real-time data** — Convex queries and mutations

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Convex |
| Auth | Clerk + Convex `auth.config.ts` |
| AI | OpenRouter (`@openrouter/ai-sdk-provider`, `ai`) |
| X/Twitter content | Scira API |
| Object storage | Cloudflare R2 (`@aws-sdk/client-s3`) |
| Package manager | **pnpm** (required) |
| Mobile | Expo SDK 54 + Expo Router (see `apps/mobile`) |

## Repository layout

High-level structure (generated files and dependencies omitted):

```text
.
├── .agents/skills/              # Agent/cursor skills (see AGENTS.md)
├── apps/
│   ├── web/                     # Next.js 16 app (Orgnote UI)
│   │   ├── app/                 # App Router, API routes, pages
│   │   ├── components/          # shadcn + feature components
│   │   ├── hooks/ lib/ providers/ stores/ types/ public/
│   │   ├── proxy.ts             # Clerk middleware (route protection)
│   │   └── components.json      # shadcn config
│   └── mobile/                  # Expo + React Native (Convex + Clerk)
│       ├── app/                 # Expo Router screens
│       └── components/          # Native-only UI
├── convex/                      # Shared Convex backend (web + mobile)
│   ├── bookmark_metadata/
│   ├── bookmarks/ groups/ profile/ vault/
│   ├── lib/
│   ├── schema.ts
│   ├── auth.config.ts
│   └── vault_node.ts
├── pnpm-workspace.yaml
├── AGENTS.md
└── package.json                 # Root scripts (dev, convex, lint, typecheck)
```

## Prerequisites

- **Node.js** 20+ recommended (Next.js 16)
- **pnpm**
- Accounts / keys: **Convex**, **Clerk**, **OpenRouter**, **Scira**, **Cloudflare R2** (for vault uploads)

## Quick start

### 1. Clone and install

```bash
git clone <repository-url>
cd goldfish
pnpm install
```

### 2. Environment files

Copy the example file and fill in values:

```bash
cp .env.example .env.local
```

See [Environment variables](#environment-variables) below for the full list.

### 3. Clerk

1. Create an application at [clerk.com](https://clerk.com).
2. Add the standard Clerk keys to **`.env.local`** (Clerk’s Next.js docs: publishable + secret keys).
3. Configure a **Convex** JWT template in Clerk (name it `convex` per Convex + Clerk guides).
4. Set **`CLERK_FRONTEND_API_URL`** in the **Convex dashboard** (used in `convex/auth.config.ts` — same value as Clerk’s Frontend API / issuer domain).

### 4. Convex

```bash
pnpm exec convex dev
```

This links the project, creates a dev deployment, and syncs `NEXT_PUBLIC_CONVEX_URL` into your local env flow. Keep this running alongside the app (or use `pnpm dev`, which runs frontend + backend in parallel).

### 5. Convex dashboard secrets

In Convex → **Settings → Environment Variables**, set:

- `CLERK_FRONTEND_API_URL`
- `OPENROUTER_API_KEY`
- `SCIRA_API_KEY`
- R2-related variables (see table below)

### 6. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Mobile app (Expo)

1. Copy env for the native app (same Convex URL and Clerk **publishable** key as the web app):

   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   ```

   Set `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `apps/mobile/.env`.

2. From the repo root, install (if you have not already) and start Metro:

   ```bash
   pnpm install
   pnpm dev:mobile
   ```

   Keep `pnpm dev:backend` (or `pnpm dev`) running in another terminal so Convex stays in sync.

### Local production APK (Android)

From the **repository root**, generate native projects and build a release APK (requires Android SDK / JDK; `ANDROID_HOME` set). Use the same `apps/mobile` env (`.env`) you use for dev so signing and package id match your setup.

```bash
cd apps/mobile
npx expo prebuild
cd android
./gradlew assembleRelease
```

The unsigned (or your keystore-configured) APK is typically at:

`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

For signing and Play-ready builds, use **EAS Build** (see `apps/mobile/package.json` scripts such as `eas:build:android:production`) or follow Android’s [app signing](https://developer.android.com/studio/publish/app-signing) docs after `prebuild`.

After dependency or native changes, run `npx expo doctor` in `apps/mobile` and fix any reported version mismatches.

---

## Environment variables

Variables are split by **where** they are read: Next.js (`.env.local` / Vercel) vs **Convex dashboard**.

### Next.js — `.env.local` (development)

These variables live in the **repo root** `.env.local` (or `.env`). `apps/web/next.config.ts` loads env from the monorepo root so you can keep one file next to `convex/`.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_CONVEX_URL` | **Yes** | Convex deployment URL (`https://….convex.cloud`). App throws if missing. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | **Yes** (vault) | Public base URL for R2 bucket objects (must match signed URLs). Used by `app/api/download-vault-file`. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | If you use Convex HTTP/site features | Convex `.site` URL when applicable. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site URL (e.g. `http://localhost:3000`); reserve for SEO/sharing if you wire it in. |
| Clerk `NEXT_PUBLIC_*` + secret | **Yes** | Standard Clerk Next.js variables from the Clerk dashboard. |

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.example` are only needed if you configure Google OAuth manually outside Clerk’s defaults—follow Clerk’s OAuth setup if you use them.

### Convex dashboard

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `CLERK_FRONTEND_API_URL` | **Yes** | Clerk Frontend API URL for JWT validation (`convex/auth.config.ts`). |
| `OPENROUTER_API_KEY` | **Yes** (AI metadata) | OpenRouter API key. |
| `GOOGLE_SAFE_BROWSING_API_KEY` | **Optional** | [Google Safe Browsing API](https://developers.google.com/safe-browsing) key. When set, new/updated bookmark URLs are checked; matches are hidden from public profiles. If unset, checks are skipped. **E2E test:** bookmark `https://testsafebrowsing.appspot.com/s/malware.html` — the public API often returns no match for `.../phishing.html` even though Chrome warns on it. |
| `SCIRA_API_KEY` | **Yes** (X/Twitter) | Scira key for tweet/thread extraction. |
| `R2_ACCOUNT_ID` | **Yes** (vault) | Cloudflare account ID for R2. |
| `R2_BUCKET_NAME` | **Yes** (vault) | Bucket name. |
| `R2_ACCESS_KEY_ID` | **Yes** (vault) | R2 S3 API access key. |
| `R2_SECRET_ACCESS_KEY` | **Yes** (vault) | R2 S3 API secret. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | **Yes** (vault) | Same public object base URL as in Next.js (used in `convex/lib/constants.ts` for URL building). |

### Production (e.g. Vercel)

Set the same **Next.js** variables as in `.env.local`, plus anything your host needs for Clerk.

Common Convex-related production vars (names may match your CI setup):

| Variable | Purpose |
| -------- | ------- |
| `CONVEX_DEPLOY_KEY` | Deploy Convex functions from CI / Vercel build |
| `CONVEX_DEPLOYMENT` | Deployment name |
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Production `.site` URL if used |

Deploy Convex:

```bash
pnpm exec convex deploy
```

---

## Database schema (Convex)

| Table | Purpose |
| ----- | ------- |
| `userProfile` | Public profile (`username`, bio, links, visibility) |
| `groups` | Bookmark groups |
| `bookmarks` | Links, metadata, `doneReading`, `groupId` |
| `sciraUsage` | Daily Scira usage per user |
| `openRouterMetadataUsage` | Daily OpenRouter metadata usage per user |
| `metadataJobs` | Async bookmark metadata pipeline status |
| `vaultFiles` | Uploaded files (R2 URLs, optional `vaultGroups`) |
| `vaultGroups` | Vault collections |

`_creationTime` is provided by Convex on every document.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Next.js + `convex dev` in parallel |
| `pnpm dev:frontend` | Next.js only |
| `pnpm dev:backend` | Convex only |
| `pnpm build` | Production Next.js build |
| `pnpm start` | Start production server |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm fmt` / `pnpm fmt:check` | oxfmt |

`predev` runs `convex dev --until-success` so codegen is ready before parallel dev.

---

## Architecture (short)

1. **Auth** — Clerk on the client; Convex validates identity via Clerk JWT (`ctx.auth.getUserIdentity()`).
2. **Bookmarks** — Stored in Convex; metadata enrichment runs in actions (Open Graph, GitHub API, Scira, OpenRouter `openai/gpt-oss-120b`).
3. **Vault** — Convex Node actions talk to R2 with presigned uploads; public URLs use `NEXT_PUBLIC_R2_PUBLIC_URL`; downloads can go through `app/api/download-vault-file` for allowlisted URLs.
4. **Rate limits** — Enforced using daily counters in `sciraUsage` / `openRouterMetadataUsage` (see Convex rate-limit helpers).

---

## AI & agent development

- **`AGENTS.md`** — Project rules (shadcn, pnpm, React hooks summary) and **where to load skills**.
- **`.agents/skills/`** — Deeper guides, e.g. Convex best practices and the frontend `use-effect` skill.

---

## Contributing

1. Fork and create a branch.
2. `pnpm lint && pnpm typecheck` before pushing.
3. Open a pull request.

---

## Acknowledgments

- **[minimal.so](https://minimal.so)** — Inspiration for bookmark UX and structure.
- **[Kilo Code](https://kilo.ai)** — Kimi K2.5 access during development.



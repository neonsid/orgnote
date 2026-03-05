# Orgnote

AI-powered bookmark manager that saves links and provides instant AI summaries so bookmarks make sense at a glance.

## Features

- **AI-Powered Summaries** – Automatically generates descriptions for bookmarked URLs
- **Smart URL Classification** – Different extraction strategies for Twitter/X posts, GitHub repos, and generic websites
- **Group Organization** – Organize bookmarks into color-coded collections
- **Public Profiles** – Share your bookmark collections publicly with custom usernames
- **Rate-Limited AI Usage** – 20 AI requests per user per day to manage API costs
- **Google OAuth** – Social login support
- **Email Authentication** – Secure email-based auth with verification and password reset
- **Real-time Sync** – Convex provides live data synchronization

## Tech Stack

| Layer               | Technology                          |
| ------------------- | ----------------------------------- |
| **Framework**       | Next.js 16 (App Router)             |
| **Language**        | TypeScript 5                        |
| **UI**              | React 19 + Tailwind CSS + shadcn/ui |
| **Backend**         | Convex (real-time serverless)       |
| **Authentication**  | Better Auth with Prisma adapter     |
| **Database (Auth)** | PostgreSQL (Prisma ORM)             |
| **AI Integration**  | OpenRouter AI SDK                   |
| **Hosting**         | Vercel                              |
| **Email**           | Resend                              |

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- PostgreSQL database (local Docker or cloud provider like Neon)
- Convex account
- Vercel account
- OpenRouter API key
- Scira API key (for X/Twitter content)
- Google OAuth credentials (for social login)
- Resend API key (for email)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd orgnote
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 3. Set Up PostgreSQL Database

For local development with Docker:

```bash
docker run -d \
  --name orgnote-postgres \
  -e POSTGRES_USER=orgnote \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=orgnote \
  -p 5432:5432 \
  postgres:15
```

Then set `DEV_DATABASE_URL=postgresql://orgnote:password@localhost:5432/orgnote` in `.env.local`.

### 4. Set Up Convex

```bash
npx convex dev
```

This will:

- Authenticate with Convex
- Create a development deployment
- Generate the Convex client configuration

### 5. Push Database Schema

```bash
pnpm db:push
```

### 6. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

### Vercel Dashboard Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable                      | Description                                                          | Required    | Example                                                                      |
| ----------------------------- | -------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`           | Convex deployment key for production builds                          | **Yes**     | `prod:your-key-here`                                                         |
| `CONVEX_DEPLOYMENT`           | Your Convex deployment name                                          | **Yes**     | `calm-octopus-227`                                                           |
| `NEXT_PUBLIC_CONVEX_URL`      | Your Convex HTTP API URL                                             | **Yes**     | `https://calm-octopus-227.convex.cloud`                                      |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Your Convex site URL (for HTTP actions)                              | **Yes**     | `https://calm-octopus-227.convex.site`                                       |
| `NEXT_PUBLIC_SITE_URL`        | Public URL of your site                                              | **Yes**     | `https://orgnote.vercel.app`                                                 |
| `BETTER_AUTH_SECRET`          | Secret key for Better Auth (generate with `openssl rand -base64 32`) | **Yes**     | `abc123...`                                                                  |
| `BETTER_AUTH_URL`             | URL for auth callbacks (production only)                             | Production  | `https://orgnote.vercel.app`                                                 |
| `DATABASE_URL`                | Prisma database connection URL                                       | **Yes**     | `prisma://accelerate.prisma-data.net/...` (prod) or `postgresql://...` (dev) |
| `DEV_DATABASE_URL`            | Local PostgreSQL URL for development                                 | Development | `postgresql://orgnote:password@localhost:5432/orgnote`                       |
| `DIRECT_DATABASE_URL`         | Direct PostgreSQL URL for migrations (production)                    | Production  | `postgresql://user:pass@host:5432/db`                                        |
| `GOOGLE_CLIENT_ID`            | Google OAuth client ID                                               | **Yes**     | `123456789-abc.apps.googleusercontent.com`                                   |
| `GOOGLE_CLIENT_SECRET`        | Google OAuth client secret                                           | **Yes**     | `GOCSPX-...`                                                                 |
| `RESEND_API_KEY`              | Resend API key for transactional emails                              | **Yes**     | `re_123456789`                                                               |
| `FROM_EMAIL`                  | Sender email address for auth emails                                 | **Yes**     | `auth@yourdomain.com`                                                        |

### Convex Dashboard Environment Variables

Set these in your Convex dashboard (Settings → Environment Variables):

| Variable             | Description                                      | Required | How to Get                                       |
| -------------------- | ------------------------------------------------ | -------- | ------------------------------------------------ |
| `OPENROUTER_API_KEY` | API key for OpenRouter AI services               | **Yes**  | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `SCIRA_API_KEY`      | API key for Scira (X/Twitter content extraction) | **Yes**  | [scira.ai](https://scira.ai)                     |
| `SKYRA_API_KEY`      | Legacy Skyra API key (optional, for fallback)    | No       | Deprecated                                       |

### Environment-Specific Notes

#### Development (`.env.local`)

```bash
# Convex (auto-generated from `npx convex dev`)
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-secret-here

# Database (local PostgreSQL)
DEV_DATABASE_URL=postgresql://orgnote:password@localhost:5432/orgnote

# OAuth (use localhost callbacks)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
RESEND_API_KEY=re_your_key
FROM_EMAIL=auth@localhost
```

#### Production (Vercel)

```bash
# Convex
CONVEX_DEPLOY_KEY=prod:your-deploy-key
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Better Auth
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://yourdomain.com

# Database (Prisma Accelerate recommended)
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/db

# OAuth (use production domain in Google Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
RESEND_API_KEY=re_your_key
FROM_EMAIL=auth@yourdomain.com
```

## Setting Up External Services

### 1. Convex Setup

1. Go to [convex.dev](https://convex.dev) and sign up
2. Create a new project
3. Run `npx convex dev` locally to set up the dev deployment
4. Deploy to production with `npx convex deploy`
5. Copy the deployment URL and deploy key to Vercel environment variables

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
4. Copy Client ID and Client Secret to environment variables

### 3. OpenRouter Setup

1. Go to [openrouter.ai](https://openrouter.ai)
2. Create an account and generate an API key
3. Add the key to Convex environment variables as `OPENROUTER_API_KEY`
4. The app uses `openai/gpt-oss-120b` model by default

### 4. Scira Setup

1. Go to [scira.ai](https://scira.ai)
2. Sign up and get an API key
3. Add the key to Convex environment variables as `SCIRA_API_KEY`
4. This enables X/Twitter content extraction (20 requests/day per user)

### 5. Resend Setup

1. Go to [resend.com](https://resend.com)
2. Create an account and verify your domain
3. Generate an API key
4. Add the key to Vercel environment variables as `RESEND_API_KEY`
5. Set `FROM_EMAIL` to a verified sender address

### 6. PostgreSQL Database

**Option A: Local Development (Docker)**

```bash
docker run -d --name postgres \
  -e POSTGRES_USER=orgnote \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=orgnote \
  -p 5432:5432 \
  postgres:15
```

**Option B: Neon (Recommended for Production)**

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Get the connection string
4. Use the pooled connection string for `DATABASE_URL`
5. Use the direct connection string for `DIRECT_DATABASE_URL`

**Option C: Prisma Accelerate**

1. Go to [prisma.io/data-platform](https://prisma.io/data-platform)
2. Create an Accelerate project
3. Get the `prisma://` connection URL
4. Set as `DATABASE_URL`

## Database Schema

### Convex Tables

| Table         | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `users`       | User records synced from Better Auth           |
| `userProfile` | Public profile settings (bio, username, links) |
| `groups`      | Bookmark collections                           |
| `bookmarks`   | Saved links with metadata                      |
| `skyraUsage`  | API usage tracking (20 req/day limit)          |
| `sciraUsage`  | API usage tracking (20 req/day limit)          |

### Prisma Schema (PostgreSQL)

| Table          | Purpose                     |
| -------------- | --------------------------- |
| `user`         | Authentication user records |
| `session`      | Active user sessions        |
| `account`      | OAuth account connections   |
| `verification` | Email verification tokens   |

## Available Scripts

| Script                   | Description                         |
| ------------------------ | ----------------------------------- |
| `pnpm dev`               | Run Next.js + Convex in development |
| `pnpm dev:frontend`      | Run only Next.js dev server         |
| `pnpm dev:backend`       | Run only Convex dev server          |
| `pnpm build`             | Production build                    |
| `pnpm db:push`           | Push Prisma schema changes          |
| `pnpm db:migrate`        | Run production migrations           |
| `pnpm db:migrate:create` | Create a new migration              |
| `pnpm lint`              | Run ESLint                          |
| `pnpm lint:fix`          | Fix ESLint errors                   |
| `pnpm typecheck`         | Run TypeScript checks               |
| `pnpm fmt`               | Format code with oxfmt              |
| `pnpm fmt:check`         | Check code formatting               |

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables (see [Vercel Dashboard Environment Variables](#vercel-dashboard-environment-variables))
4. Add build command: `pnpm build`
5. Deploy

### Deploy Convex Functions

```bash
npx convex deploy
```

Make sure to set the `CONVEX_DEPLOY_KEY` environment variable in Vercel before deploying.

## Architecture

### Data Flow

1. User authenticates via Better Auth (PostgreSQL)
2. User data is synced to Convex via HTTP action
3. Bookmarks and groups are stored in Convex
4. AI metadata extraction happens in Convex actions
5. X/Twitter content uses Scira API + OpenRouter
6. Generic URLs use Open Graph scraping + OpenRouter

### Rate Limiting

- Users get 20 AI-powered extractions per day
- Tracked per user per day in `skyraUsage` and `sciraUsage` tables
- Resets at midnight UTC

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting and type checking: `pnpm lint && pnpm typecheck`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

## License

[MIT License](LICENSE)

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/orgnote/issues).

# Orgnote

AI-powered bookmark manager that saves links and provides instant AI summaries so bookmarks make sense at a glance.

## Features

- **AI-Powered Summaries** – Automatically generates descriptions for bookmarked URLs
- **Smart URL Classification** – Different extraction strategies for Twitter/X posts, GitHub repos, and generic websites
- **Group Organization** – Organize bookmarks into color-coded collections
- **Public Profiles** – Share your bookmark collections publicly with custom usernames
- **Rate-Limited AI Usage** – 20 AI requests per user per day to manage API costs
- **Google OAuth** – Social login support via Clerk
- **Email Authentication** – Secure email-based auth with verification and password reset via Clerk
- **Real-time Sync** – Convex provides live data synchronization

## Tech Stack

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| **Framework**      | Next.js 16 (App Router)             |
| **Language**       | TypeScript 5                        |
| **UI**             | React 19 + Tailwind CSS + shadcn/ui |
| **Backend**        | Convex (real-time serverless)       |
| **Authentication** | Clerk + Convex Auth                 |
| **AI Integration** | OpenRouter AI SDK                   |
| **Hosting**        | Vercel                              |

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- Convex account
- Clerk account
- OpenRouter API key
- Scira API key (for X/Twitter content)

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

### 3. Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy the **Frontend API URL** to `CLERK_FRONTEND_API_URL` in `.env.local`

### 4. Set Up Convex

```bash
npx convex dev
```

This will:

- Authenticate with Convex
- Create a development deployment
- Generate the Convex client configuration

### 5. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

### Development (`.env.local`)

```bash
# Clerk (get from Clerk Dashboard → API Keys)
CLERK_FRONTEND_API_URL=https://your-app.clerk.com

# Convex (auto-generated from `npx convex dev`)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel)

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable                      | Description                                 | Required | Example                                 |
| ----------------------------- | ------------------------------------------- | -------- | --------------------------------------- |
| `CLERK_FRONTEND_API_URL`      | Clerk Frontend API URL                      | **Yes**  | `https://your-app.clerk.com`            |
| `CONVEX_DEPLOY_KEY`           | Convex deployment key for production builds | **Yes**  | `prod:your-key-here`                    |
| `CONVEX_DEPLOYMENT`           | Your Convex deployment name                 | **Yes**  | `calm-octopus-227`                      |
| `NEXT_PUBLIC_CONVEX_URL`      | Your Convex HTTP API URL                    | **Yes**  | `https://calm-octopus-227.convex.cloud` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Your Convex site URL (for HTTP actions)     | **Yes**  | `https://calm-octopus-227.convex.site`  |
| `NEXT_PUBLIC_SITE_URL`        | Public URL of your site                     | **Yes**  | `https://orgnote.vercel.app`            |

### Convex Dashboard Environment Variables

Set these in your Convex dashboard (Settings → Environment Variables):

| Variable             | Description                                      | Required | How to Get                                       |
| -------------------- | ------------------------------------------------ | -------- | ------------------------------------------------ |
| `OPENROUTER_API_KEY` | API key for OpenRouter AI services               | **Yes**  | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `SCIRA_API_KEY`      | API key for Scira (X/Twitter content extraction) | **Yes**  | [scira.ai](https://scira.ai)                     |

## Setting Up External Services

### 1. Convex Setup

1. Go to [convex.dev](https://convex.dev) and sign up
2. Create a new project
3. Run `npx convex dev` locally to set up the dev deployment
4. Deploy to production with `npx convex deploy`
5. Copy the deployment URL and deploy key to Vercel environment variables

### 2. Clerk Setup

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Configure the application:
   - Add your production domain in **paths**
   - Configure OAuth providers (Google) in **SSO Providers**
4. Create a JWT template for Convex:
   - Go to **JWT Templates** → Create new template
   - Select **Convex** template
   - Name it `convex`
5. Copy the **Frontend API URL** to your environment variables

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

## Database Schema (Convex)

| Table         | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `users`       | User records                                   |
| `userProfile` | Public profile settings (bio, username, links) |
| `groups`      | Bookmark collections                           |
| `bookmarks`   | Saved links with metadata                      |
| `skyraUsage`  | API usage tracking (20 req/day limit)          |
| `sciraUsage`  | API usage tracking (20 req/day limit)          |

## Available Scripts

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Run Next.js + Convex in development |
| `pnpm dev:frontend` | Run only Next.js dev server         |
| `pnpm dev:backend`  | Run only Convex dev server          |
| `pnpm build`        | Production build                    |
| `pnpm lint`         | Run ESLint                          |
| `pnpm lint:fix`     | Fix ESLint errors                   |
| `pnpm typecheck`    | Run TypeScript checks               |
| `pnpm fmt`          | Format code with oxfmt              |
| `pnpm fmt:check`    | Check code formatting               |

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables (see [Production Environment Variables](#production-vercel))
4. Add build command: `pnpm build`
5. Deploy

### Deploy Convex Functions

```bash
npx convex deploy
```

Make sure to set the `CONVEX_DEPLOY_KEY` environment variable in Vercel before deploying.

## Architecture

### Authentication Flow

1. User authenticates via Clerk (OAuth or email)
2. Clerk provides JWT token to the client
3. Convex validates the JWT using `ctx.auth.getUserIdentity()`
4. User ID is available in all Convex queries/mutations

### Data Flow

1. User authenticates via Clerk
2. Bookmarks and groups are stored in Convex
3. AI metadata extraction happens in Convex actions
4. X/Twitter content uses Scira API + OpenRouter
5. Generic URLs use Open Graph scraping + OpenRouter

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

## Thank You

- **[minimal.so](https://minimal.so)** - This project was heavily inspired by minimal.so's bookmark manager. Their elegant design and functionality served as a great reference for building this application.
- **[Kilo Code](https://kilo.ai)** - For providing free access to their Kimi K2.5 AI subscription, which was used to help build and develop this project.

## License

[MIT License](LICENSE)

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/orgnote/issues).


- [x] Add file upload for articles
- [x] Clean the vibecoded mess

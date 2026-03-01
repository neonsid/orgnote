# CI/CD Setup Guide

This document describes the CI/CD pipeline, testing setup, and code quality tools configured for this project.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Git Hooks](#git-hooks)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses a comprehensive CI/CD pipeline with:

- **GitHub Actions** for continuous integration and deployment
- **Vitest** for unit and component testing
- **Playwright** for end-to-end testing
- **ESLint** with enhanced rules for code quality
- **Husky** and **lint-staged** for pre-commit hooks
- **Vercel** for frontend hosting
- **Convex** for backend deployment

---

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push to `main` and every pull request.

**Jobs:**
- **Lint**: Runs ESLint and formatting checks
- **Type Check**: Validates TypeScript types
- **Unit Tests**: Runs Vitest test suite with coverage reporting
- **E2E Tests**: Runs Playwright tests across multiple browsers

**Example usage:**

```bash
# These checks run automatically on PRs
# To run locally:
pnpm lint        # Check ESLint
pnpm fmt:check   # Check formatting
pnpm typecheck   # Check TypeScript
pnpm test:ci     # Run unit tests
pnpm test:e2e    # Run E2E tests
```

### 2. Deploy Preview (`.github/workflows/deploy-preview.yml`)

Runs on pull requests to create preview deployments.

**Jobs:**
- **Frontend Preview**: Deploys to Vercel preview environment
- **Backend Preview**: Deploys to Convex preview environment
- **PR Comment**: Automatically comments the preview URL on the PR

### 3. Deploy Production (`.github/workflows/deploy-production.yml`)

Runs on pushes to `main` branch.

**Jobs:**
- **Frontend Production**: Deploys to Vercel production
- **Backend Production**: Deploys to Convex production
- **Notification**: Reports deployment status

---

## Testing

### Unit & Component Tests (Vitest)

Tests are located in `__tests__/` directory.

**Running tests:**

```bash
# Run tests in watch mode (development)
pnpm test

# Run tests once (CI)
pnpm test:ci

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

**Writing tests:**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("should render correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

**Test configuration:**
- Environment: `jsdom`
- Setup file: `__tests__/setup.ts`
- Mocks: Next.js router, next-themes

### E2E Tests (Playwright)

Tests are located in `playwright-tests/` directory.

**Running tests:**

```bash
# Install browsers (first time only)
pnpm test:e2e:install

# Run E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui
```

**Test configuration:**
- Browsers: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Base URL: `http://localhost:3000`
- Auto-starts dev server

**Writing E2E tests:**

```typescript
import { test, expect } from "@playwright/test";

test("homepage has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/goldfish/i);
});
```

---

## Code Quality

### ESLint

Enhanced ESLint configuration with:

- **Next.js** recommended rules
- **TypeScript** strict type checking
- **Import ordering** with automatic grouping
- **Accessibility (jsx-a11y)** rules
- **Convex** specific rules

**Configuration:** `eslint.config.mjs`

**Running:**

```bash
pnpm lint      # Check for issues
pnpm lint:fix  # Auto-fix issues
```

**Key rules:**
- Import order: External → Internal → Parent/Sibling → Index
- Accessibility: Alt text, labels, keyboard navigation
- TypeScript: No unused vars, no explicit any
- Best practices: No console (except error/warn), strict equality

### Formatting

Uses **oxfmt** for fast formatting:

```bash
pnpm fmt        # Format all files
pnpm fmt:check  # Check formatting (CI)
```

**Configuration:** `.oxfmtrc.jsonc`
- Trailing comma: ES5
- Tab width: 2
- Semi: false
- Single quote: true
- Print width: 80

### Type Checking

```bash
pnpm typecheck  # Run TypeScript compiler
```

---

## Git Hooks

### Husky + lint-staged

**Pre-commit hook** (`.husky/pre-commit`):
- Runs lint-staged on staged files
- Formats code with oxfmt
- Lints code with ESLint

**Pre-push hook** (`.husky/pre-push`):
- Runs full test suite (`pnpm test:ci`)
- Prevents pushing if tests fail

**Configuration:** `.lintstagedrc.json`

```json
{
  "*.{js,jsx,ts,tsx}": ["oxfmt", "eslint --fix"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

**Skipping hooks (emergency only):**

```bash
git commit -m "message" --no-verify  # Skip pre-commit
```

---

## Environment Variables

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in your GitHub repository.

#### Vercel Deployment

```
VERCEL_TOKEN          # Vercel personal access token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
```

**How to get these:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Get values from `.vercel/project.json`

Or from Vercel Dashboard:
1. Project Settings → General → Project ID
2. Settings → Tokens → Create Token

#### Convex Deployment

```
CONVEX_DEPLOY_KEY     # Convex deploy key
```

**How to get this:**
1. Go to Convex Dashboard
2. Project Settings → Deploy Key
3. Or run: `npx convex deploy --dry-run` to see the key

#### Application Environment

These should also be configured in GitHub Secrets for CI:

```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CONVEX_SITE_URL
DATABASE_URL
RESEND_API_KEY
```

### Local Environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

---

## Deployment

### Automatic Deployments

**Production:**
- Push to `main` branch
- GitHub Actions runs CI
- If CI passes, deploys to production automatically

**Preview:**
- Create a pull request
- GitHub Actions deploys preview environment
- PR receives comment with preview URL
- Merging triggers production deployment

### Manual Deployments

**Frontend (Vercel):**

```bash
# Using Vercel CLI
vercel --prod

# Or deploy preview
vercel
```

**Backend (Convex):**

```bash
# Deploy to production
npx convex deploy --prod

# Deploy to preview (branch)
npx convex deploy
```

---

## Troubleshooting

### CI/CD Issues

**Tests failing in CI but passing locally:**
- Check for environment variable differences
- Ensure all env vars are set in GitHub Secrets
- Check Node.js version matches (20.x)

**Vercel deployment failing:**
- Verify `VERCEL_TOKEN` has correct permissions
- Check `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
- Ensure project is linked: `vercel link`

**Convex deployment failing:**
- Verify `CONVEX_DEPLOY_KEY` is valid
- Check deployment logs in Convex Dashboard
- Ensure schema is valid: `npx convex dev` locally

### Git Hooks Issues

**Husky not running:**
```bash
# Reinstall husky
pnpm prepare
```

**Pre-commit too slow:**
- lint-staged only runs on staged files (should be fast)
- Consider excluding large files in `.lintstagedrc.json`

### Testing Issues

**Playwright browsers not found:**
```bash
pnpm test:e2e:install
```

**Tests timing out:**
- Increase timeout in `playwright.config.ts`
- Check if dev server starts correctly

### ESLint Issues

**Import order errors:**
- Run `pnpm lint:fix` to auto-fix
- Ensure imports are grouped: builtin → external → internal → relative

**TypeScript errors:**
- Run `pnpm typecheck` to see all errors
- Update `tsconfig.json` if needed

---

## Contributing

### Before Committing

1. Code should pass all linting rules
2. Format code with `pnpm fmt`
3. Type check with `pnpm typecheck`
4. Tests should pass: `pnpm test:ci`

### Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make changes and commit (husky runs automatically)
3. Push branch: `git push origin feat/my-feature`
4. Create pull request
5. CI runs automatically
6. Review preview deployment
7. Merge when CI passes

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [ESLint Documentation](https://eslint.org/docs/latest)

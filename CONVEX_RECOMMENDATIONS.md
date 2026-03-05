# Convex Security and Efficiency Recommendations

## Context

This project uses Prisma + Better Auth for authentication. Convex should not trust client-passed `userId` values for private data access.

## Recommended Architecture

- Keep Better Auth as the source of identity.
- Route private data operations through Next.js server endpoints/server actions (BFF pattern).
- In server handlers, resolve identity using Better Auth server API:

```ts
const session = await auth.api.getSession({ headers: await headers() });
```

- Call Convex from server-side code with `session.user.id`.
- Keep only truly public Convex queries callable directly from the client.

## Key Risks Found

- **Client-trusted identity**: private Convex mutations/queries currently accept `userId` from the client.
- **Unauthenticated sync endpoint**: `/sync-user` can be called publicly without strong request auth.
- **Secret exposure**: API keys are present in `convex/.env` and must be rotated.
- **Repeated ownership checks**: ownership logic is duplicated across mutations/queries.
- **N+1 query patterns**: several endpoints fetch groups/bookmarks in sequential loops.

## Execution Plan

### 1) Security Baseline (Immediate)

- Rotate leaked keys (`SCIRA_API_KEY`, `OPENROUTER_API_KEY`) immediately.
- Remove secrets from tracked files and store only in deployment environment variables.
- Protect `/sync-user` with server-to-server authentication (shared secret or signed request).

### 2) Private API Boundary

- Create Next.js server routes/actions for private group/bookmark/profile operations.
- In each route/action:
  - Resolve Better Auth session on the server.
  - Reject unauthenticated calls.
  - Call Convex with server-derived `userId`.
- Update frontend to call BFF routes for private operations.

### 3) Convex Hardening

- Remove client-facing `args.userId` from private Convex APIs where possible.
- Keep public Convex functions explicitly separated from private ones.
- Standardize errors for unauthorized and not-found cases.

### 4) Ownership Check Deduplication

Create `convex/lib/authz.ts` and centralize ownership logic:

- `requireGroupOwner(ctx, groupId, userId)` -> returns `group`
- `requireBookmarkOwner(ctx, bookmarkId, userId)` -> returns `{ bookmark, group }`

Benefits:

- Eliminates repeated ownership checks.
- Reduces logic drift and security inconsistencies.
- Avoids duplicate DB reads by returning loaded entities.

### 5) Efficiency Improvements

- Replace sequential loops with `Promise.all` where safe.
- Reduce N+1 patterns in dashboard/public-profile aggregations.
- Consider denormalizing bookmark ownership (`userProvidedId` on bookmarks) with supporting indexes for direct user-level queries.
- Reduce payload size for list endpoints by returning only necessary fields.

### 6) Verification and Tests

- Add auth tests for owner vs non-owner access.
- Add unauthenticated access tests for BFF endpoints and `/sync-user`.
- Add performance checks for dashboard/public-profile query latency on realistic data volume.

## Implementation Notes

- A full BFF migration is the most secure path for Prisma + Better Auth + Convex.
- Minimal patch option exists (centralized ownership helper only), but it does not fully address client identity spoofing risk.

import { ConvexError } from 'convex/values'
import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import { mutation, query } from '../_generated/server'
import type { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server'

export async function requireAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    })
  }
  return identity.subject
}

/** Public queries/mutations that need the Clerk user id should use this instead of `query` + `requireAuth`. */
export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => ({
    userId: await requireAuth(ctx),
  }))
)

/** Public mutations that need the Clerk user id should use this instead of `mutation` + `requireAuth`. */
export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => ({
    userId: await requireAuth(ctx),
  }))
)

import { ConvexError } from 'convex/values'
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

import { ConvexError } from "convex/values";
import type {
    QueryCtx,
    MutationCtx,
    ActionCtx,
} from "../_generated/server";

/**
 * Shared authentication helper.
 *
 * Checks for user identity and returns the userId (identity.subject).
 * Throws an UNAUTHORIZED ConvexError if the user is not authenticated.
 *
 * Usage in any query, mutation, or action handler:
 * ```ts
 * import { requireAuth } from "./lib/auth";
 *
 * export const myQuery = query({
 *   args: { ... },
 *   handler: async (ctx, args) => {
 *     const userId = await requireAuth(ctx);
 *     // userId is now available
 *   },
 * });
 * ```
 */
export async function requireAuth(
    ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
        });
    }
    return identity.subject;
}

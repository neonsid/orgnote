import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { rateLimiter } from "./rate_limit";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Internal action with rate limiting for user sync
export const syncUserWithRateLimit = internalAction({
  args: {
    userProvidedId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    // Check rate limit for sync operations
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "syncUser", {
      key: args.userProvidedId,
    });

    if (!ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: `Rate limit exceeded. Try again after ${retryAfter}ms`,
      });
    }

    // Call the internal mutation to create or update user
    const result = await ctx.runMutation(
      internal.users.createOrUpdateUser,
      {
        userProvidedId: args.userProvidedId,
        name: args.name,
        email: args.email,
      },
    );

    if (!result) {
      throw new ConvexError({
        code: "USER_SYNC_FAILED",
        message: "Failed to create or update user",
      });
    }

    return result;
  },
});

// CORS preflight handler for /sync-user
http.route({
  path: "/sync-user",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

http.route({
  path: "/sync-user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { userProvidedId, name, email } = body;

      if (!userProvidedId || !name || !email) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          },
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      // Validate userProvidedId format (should be a non-empty string)
      if (typeof userProvidedId !== "string" || userProvidedId.length < 1) {
        return new Response(JSON.stringify({ error: "Invalid user ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      // Call the rate-limited action
      const result = await ctx.runAction(internal.http.syncUserWithRateLimit, {
        userProvidedId,
        name,
        email,
      });

      return new Response(JSON.stringify({ success: true, userId: result }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (error) {
      console.error("Error syncing user:", error);

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes("Rate limit")) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please try again later.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          },
        );
      }

      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  }),
});

export default http;

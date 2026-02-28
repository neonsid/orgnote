import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

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
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Call the mutation to create or update user
      const result = await ctx.runMutation(api.users.createOrUpdateUser, {
        userProvidedId,
        name,
        email,
      });

      return new Response(JSON.stringify({ success: true, userId: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error syncing user:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;

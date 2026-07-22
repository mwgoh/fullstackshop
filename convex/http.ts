import { httpRouter } from "convex/server";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Register this URL as a webhook endpoint in the Clerk dashboard
// (Configure -> Webhooks -> Add Endpoint), subscribed to the user.created,
// user.updated, and user.deleted events, so that edits made to a user
// directly in Clerk stay in sync with the Convex `users` table. Requires
// CLERK_WEBHOOK_SIGNING_SECRET to be set on this Convex deployment (Clerk
// shows this value, `whsec_...`, when you create the endpoint).
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let event;
    try {
      event = await verifyWebhook(request);
    } catch (error) {
      console.error("Clerk webhook signature verification failed:", error);
      return new Response("Invalid webhook signature", { status: 400 });
    }

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;
      case "user.deleted": {
        const clerkUserId = event.data.id;
        if (clerkUserId) {
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkUserId,
          });
        }
        break;
      }
      default:
        console.log("Ignoring Clerk webhook event:", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;

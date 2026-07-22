import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
    userId: v.optional(v.id("users")),
  }),
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    tokenIdentifier: v.string(),
    // The raw Clerk user id (`identity.subject`). Used to reconcile this row
    // with Clerk webhook events, which don't carry a `tokenIdentifier`.
    externalId: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_external_id", ["externalId"]),
});

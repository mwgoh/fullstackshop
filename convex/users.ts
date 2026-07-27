import { v, Validator } from "convex/values";
import type { UserJSON } from "@clerk/backend";
import {
  internalMutation,
  mutation,
  query,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";

// Read-only lookup of the current user's row. Unlike getOrCreateUser, this
// never writes, so it's safe to call from queries; returns null if signed
// out or if no `users` row exists yet for this identity.
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

// Upserts a `users` row for the currently authenticated Clerk identity and
// returns it. Throws if there is no authenticated identity. Shared by any
// mutation that needs to attribute a write to the current user.
export async function getOrCreateUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Called getOrCreateUser without authentication present");
  }

  // Look up by the canonical auth key first. Fall back to the raw Clerk user
  // id in case a webhook already provisioned this row (e.g. an admin created
  // the user from the Clerk dashboard before their first sign-in here).
  const user =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()) ??
    (await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) =>
        q.eq("externalId", identity.subject),
      )
      .unique());

  if (user !== null) {
    if (
      user.tokenIdentifier !== identity.tokenIdentifier ||
      user.externalId !== identity.subject ||
      (identity.name !== undefined && user.name !== identity.name) ||
      (identity.email !== undefined && user.email !== identity.email)
    ) {
      await ctx.db.patch("users", user._id, {
        tokenIdentifier: identity.tokenIdentifier,
        externalId: identity.subject,
        name: identity.name ?? user.name,
        email: identity.email ?? user.email,
      });
    }
    return (await ctx.db.get("users", user._id))!;
  }

  // If it's a new identity, create a new `User`.
  const userId = await ctx.db.insert("users", {
    name: identity.name ?? "Anonymous",
    email: identity.email,
    tokenIdentifier: identity.tokenIdentifier,
    externalId: identity.subject,
    role: "customer",
  });
  return (await ctx.db.get("users", userId))!;
}

// Throws unless the currently authenticated user has the "admin" role.
// Used to gate admin-only mutations (product management, order status, etc).
export async function requireAdmin(ctx: MutationCtx) {
  const user = await getOrCreateUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Not authorized: admin role required");
  }
  return user;
}

// Read-only counterpart of requireAdmin, for admin-only queries.
export async function requireAdminQuery(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (user === null || user.role !== "admin") {
    throw new Error("Not authorized: admin role required");
  }
  return user;
}

// The current user's own row, for client-side profile/role display (e.g.
// gating admin screens). Returns null if signed out.
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Called by the client (via useStoreUserEffect) right after Clerk sign-in
// completes, to sync the authenticated identity into our own `users` table.
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    return user._id;
  },
});

async function userByExternalId(ctx: MutationCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();
}

// Keeps `users` in sync with user.created / user.updated events sent by the
// Clerk webhook (see convex/http.ts), so edits made directly in the Clerk
// dashboard are reflected here even if the user never opens this app again.
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  handler: async (ctx, { data }) => {
    const email = data.email_addresses.find(
      (address) => address.id === data.primary_email_address_id,
    )?.email_address;
    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ") ||
      "Anonymous";

    const existing = await userByExternalId(ctx, data.id);
    if (existing === null) {
      await ctx.db.insert("users", {
        name,
        email,
        externalId: data.id,
        // No Convex session has authenticated as this user yet. A real value
        // is adopted the first time they sign in, in getOrCreateUser above.
        tokenIdentifier: `clerk-webhook:${data.id}`,
        role: "customer",
      });
    } else {
      await ctx.db.patch("users", existing._id, { name, email });
    }
  },
});

// Keeps `users` in sync with user.deleted events sent by the Clerk webhook.
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const existing = await userByExternalId(ctx, clerkUserId);
    if (existing !== null) {
      await ctx.db.delete("users", existing._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

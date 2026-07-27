import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { getOrCreateUser, getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

async function getOrCreateCart(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("carts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (existing !== null) {
    return existing;
  }
  const cartId = await ctx.db.insert("carts", { userId });
  return (await ctx.db.get("carts", cartId))!;
}

// Verifies cartItemId belongs to the current user's cart and returns both
// rows. Throws if the item doesn't exist or belongs to someone else's cart.
async function requireOwnCartItem(ctx: MutationCtx, cartItemId: Id<"cartItems">) {
  const user = await getOrCreateUser(ctx);
  const item = await ctx.db.get("cartItems", cartItemId);
  if (item === null) {
    throw new Error("Cart item not found");
  }
  const cart = await ctx.db.get("carts", item.cartId);
  if (cart === null || cart.userId !== user._id) {
    throw new Error("Not authorized to modify this cart item");
  }
  return item;
}

// My cart contents, joined with the referenced product for display.
export const getMyCart = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (cart === null) {
      return [];
    }
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", cart._id))
      .collect();
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        product: await ctx.db.get("products", item.productId),
      })),
    );
  },
});

export const addItem = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      throw new Error("Quantity must be positive");
    }
    const product = await ctx.db.get("products", args.productId);
    if (product === null) {
      throw new Error("Product not found");
    }

    const user = await getOrCreateUser(ctx);
    const cart = await getOrCreateCart(ctx, user._id);

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId_and_productId", (q) =>
        q.eq("cartId", cart._id).eq("productId", args.productId),
      )
      .unique();

    if (existing !== null) {
      await ctx.db.patch("cartItems", existing._id, {
        quantity: existing.quantity + args.quantity,
      });
    } else {
      await ctx.db.insert("cartItems", {
        cartId: cart._id,
        productId: args.productId,
        quantity: args.quantity,
      });
    }
  },
});

// Sets the quantity for a cart item; deleting it when quantity drops to 0.
export const updateQuantity = mutation({
  args: { cartItemId: v.id("cartItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    const item = await requireOwnCartItem(ctx, args.cartItemId);
    if (args.quantity <= 0) {
      await ctx.db.delete("cartItems", item._id);
    } else {
      await ctx.db.patch("cartItems", item._id, { quantity: args.quantity });
    }
  },
});

export const removeItem = mutation({
  args: { cartItemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    const item = await requireOwnCartItem(ctx, args.cartItemId);
    await ctx.db.delete("cartItems", item._id);
  },
});

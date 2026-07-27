import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, internalMutation } from "./_generated/server";
import { getOrCreateUser, getCurrentUser, requireAdmin, requireAdminQuery } from "./users";
import { orderStatusValidator } from "./schema";

const shippingAddressFields = v.object({
  recipientName: v.string(),
  phone: v.string(),
  zipCode: v.string(),
  address1: v.string(),
  address2: v.optional(v.string()),
}).fields;

// Snapshots the current user's cart into a new pending order (orders +
// orderItems), then empties the cart. Called right before starting Stripe
// Checkout.
export const createFromCart = mutation({
  args: { shippingAddress: v.object(shippingAddressFields) },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    const items =
      cart === null
        ? []
        : await ctx.db
            .query("cartItems")
            .withIndex("by_cartId", (q) => q.eq("cartId", cart._id))
            .collect();
    if (items.length === 0) {
      throw new Error("장바구니가 비어 있습니다");
    }

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get("products", item.productId);
        if (product === null) {
          throw new Error("존재하지 않는 상품이 장바구니에 포함되어 있습니다");
        }
        return { item, product };
      }),
    );

    const totalAmount = itemsWithProducts.reduce(
      (sum, { item, product }) => sum + product.price * item.quantity,
      0,
    );

    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      status: "pending",
      totalAmount,
      shippingAddress: args.shippingAddress,
    });

    for (const { item, product } of itemsWithProducts) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
      await ctx.db.delete("cartItems", item._id);
    }

    return orderId;
  },
});

// The current user's orders, most recent first.
export const listMyOrders = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// A single order (with its line items) belonging to the current user.
export const getMyOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.userId !== user._id) {
      return null;
    }
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .collect();
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => ({
        ...item,
        product: await ctx.db.get("products", item.productId),
      })),
    );
    return { ...order, items: itemsWithProducts };
  },
});

// Admin listing: every order regardless of owner, newest first.
export const listAllForAdmin = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdminQuery(ctx);
    return await ctx.db.query("orders").order("desc").paginate(args.paginationOpts);
  },
});

// Admin-only order status update (준비중 -> 배송중 -> 완료, or cancel).
export const updateStatus = mutation({
  args: { orderId: v.id("orders"), status: orderStatusValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("orders", args.orderId);
    if (existing === null) {
      throw new Error("Order not found");
    }
    await ctx.db.patch("orders", args.orderId, { status: args.status });
  },
});

// Records the Stripe Checkout Session id on the order right after it's
// created, so the webhook can look the order back up by session id.
export const setStripeSessionId = internalMutation({
  args: { orderId: v.id("orders"), stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch("orders", args.orderId, {
      stripeSessionId: args.stripeSessionId,
    });
  },
});

// Called by the Stripe webhook on checkout.session.completed.
export const markOrderPaidBySessionId = internalMutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripeSessionId", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId),
      )
      .unique();
    if (order === null) {
      console.warn("No order found for Stripe session", args.stripeSessionId);
      return;
    }
    await ctx.db.patch("orders", order._id, {
      status: "paid",
      paymentProvider: "stripe",
      stripePaymentIntentId: args.stripePaymentIntentId,
    });
  },
});

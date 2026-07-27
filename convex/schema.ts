import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Shared across schema.ts and orders.ts (order status update mutation) so
// the set of valid statuses only has to be listed in one place.
export const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("preparing"),
  v.literal("shipping"),
  v.literal("completed"),
  v.literal("cancelled"),
);

// Shared across schema.ts and products.ts so the set of valid categories
// only has to be listed in one place.
export const productCategoryValidator = v.union(
  v.literal("home_living"),
  v.literal("books"),
  v.literal("fashion"),
  v.literal("electronics"),
);

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
    role: v.union(v.literal("customer"), v.literal("admin")),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_external_id", ["externalId"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    stock: v.number(),
    isActive: v.boolean(),
    category: productCategoryValidator,
  })
    .index("by_isActive", ["isActive"])
    .index("by_isActive_and_category", ["isActive", "category"]),

  carts: defineTable({
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),

  cartItems: defineTable({
    cartId: v.id("carts"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_cartId", ["cartId"])
    .index("by_cartId_and_productId", ["cartId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    status: orderStatusValidator,
    totalAmount: v.number(),
    shippingAddress: v.object({
      recipientName: v.string(),
      phone: v.string(),
      zipCode: v.string(),
      address1: v.string(),
      address2: v.optional(v.string()),
    }),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    // 결제 수단 선택(Stripe/토스페이먼츠)에 따라 채워지는 필드. 결제가
    // 완료되기 전까지는 비어 있다.
    paymentProvider: v.optional(v.union(v.literal("stripe"), v.literal("toss"))),
    tossPaymentKey: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_stripeSessionId", ["stripeSessionId"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    priceAtPurchase: v.number(),
  }).index("by_orderId", ["orderId"]),
});

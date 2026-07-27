import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { requireAdmin, requireAdminQuery } from "./users";
import { productCategoryValidator } from "./schema";

const productFields = v.object({
  name: v.string(),
  description: v.string(),
  price: v.number(),
  images: v.array(v.string()),
  stock: v.number(),
  isActive: v.boolean(),
  category: productCategoryValidator,
});

// Public catalog listing: only active products, newest first. Optionally
// scoped to a single category (used by the category nav/tiles).
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(productCategoryValidator),
  },
  handler: async (ctx, args) => {
    if (args.category !== undefined) {
      const category = args.category;
      return await ctx.db
        .query("products")
        .withIndex("by_isActive_and_category", (q) =>
          q.eq("isActive", true).eq("category", category),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get("products", args.productId);
  },
});

// Admin listing: every product regardless of isActive, newest first.
export const listAllForAdmin = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdminQuery(ctx);
    return await ctx.db.query("products").order("desc").paginate(args.paginationOpts);
  },
});

export const create = mutation({
  args: productFields.fields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    ...productFields.partial().fields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { productId, ...patch } = args;
    const existing = await ctx.db.get("products", productId);
    if (existing === null) {
      throw new Error("Product not found");
    }
    await ctx.db.patch("products", productId, patch);
  },
});

export const remove = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("products", args.productId);
    if (existing === null) {
      throw new Error("Product not found");
    }
    await ctx.db.delete("products", args.productId);
  },
});

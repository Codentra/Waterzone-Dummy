import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

export const submit = mutation({
  args: {
    customerId: v.id("users"),
    orderId: v.id("orders"),
    stars: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    if (args.stars < 1 || args.stars > 5) throw new Error("Rating must be 1-5 stars");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.customerId !== args.customerId) throw new Error("Not your order");
    if (order.status !== "delivered") throw new Error("Order not delivered yet");
    if (!order.assignedDriverId) throw new Error("No driver on order");

    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    if (existing) throw new Error("Already rated");

    return await ctx.db.insert("ratings", {
      orderId: args.orderId,
      customerId: args.customerId,
      driverId: order.assignedDriverId,
      stars: args.stars,
      comment: args.comment?.trim(),
      createdAt: Date.now(),
    });
  },
});

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

export const driverAverage = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect();
    if (ratings.length === 0) return { average: 0, count: 0 };
    const sum = ratings.reduce((a, r) => a + r.stars, 0);
    return { average: sum / ratings.length, count: ratings.length };
  },
});

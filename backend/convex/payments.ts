import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

export const createIntent = mutation({
  args: {
    customerId: v.id("users"),
    orderId: v.id("orders"),
    provider: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.customerId !== args.customerId) throw new Error("Order not found");

    const now = Date.now();
    return await ctx.db.insert("paymentIntents", {
      orderId: args.orderId,
      customerId: args.customerId,
      provider: args.provider,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getIntent = query({
  args: { intentId: v.id("paymentIntents") },
  handler: async (ctx, args) => ctx.db.get(args.intentId),
});

export const markIntentPaid = mutation({
  args: {
    customerId: v.id("users"),
    intentId: v.id("paymentIntents"),
    providerRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const intent = await ctx.db.get(args.intentId);
    if (!intent || intent.customerId !== args.customerId) throw new Error("Not found");

    const now = Date.now();
    await ctx.db.patch(args.intentId, {
      status: "paid",
      providerRef: args.providerRef,
      updatedAt: now,
    });

    const order = await ctx.db.get(intent.orderId);
    if (order) {
      await ctx.db.patch(intent.orderId, {
        paymentStatus: "paid",
        paymentMethod: intent.provider,
        paidAt: now,
        updatedAt: now,
      });
    }
  },
});

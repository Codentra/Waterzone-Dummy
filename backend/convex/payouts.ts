import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";
import { ensureWallet } from "./pricingHelpers";

/** Driver: request payout from wallet balance. */
export const requestPayout = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");

    const wallet = await ctx.db
      .query("walletAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!wallet || wallet.balance < args.amount) {
      throw new Error("Insufficient wallet balance");
    }

    const pending = await ctx.db
      .query("payoutRequests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    if (pending.some((p) => p.status === "pending")) {
      throw new Error("You already have a pending payout request");
    }

    return await ctx.db.insert("payoutRequests", {
      driverId: driver._id,
      userId: args.userId,
      amount: args.amount,
      currency: wallet.currency,
      status: "pending",
      requestedAt: Date.now(),
    });
  },
});

/** Driver: list my payout requests. */
export const listMyPayouts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    return await ctx.db
      .query("payoutRequests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

/** Ensure wallet exists when driver registers earnings path. */
export const ensureDriverWallet = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver", "customer", "admin"]);
    const wallet = await ensureWallet(ctx.db, args.userId, "USD");
    return wallet._id;
  },
});

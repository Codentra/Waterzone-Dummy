import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

/**
 * Get wallet for user (if any).
 */
export const getWallet = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("walletAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Create wallet (call after user creation if needed).
 */
export const createWallet = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("walletAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("walletAccounts", {
      userId: args.userId,
      balance: 0,
      currency: "USD",
      updatedAt: now,
    });
  },
});

/**
 * List wallet transactions for user (newest first).
 */
export const listTransactions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(100);
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },
});

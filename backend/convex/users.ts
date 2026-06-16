import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const role = v.union(
  v.literal("customer"),
  v.literal("driver"),
  v.literal("admin")
);

/**
 * Create a user (placeholder auth – no OTP).
 * Call this from the app after "sign in" to get or create user by phone.
 */
export const createUser = mutation({
  args: {
    fullName: v.string(),
    phoneE164: v.string(),
    role,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneE164", args.phoneE164))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("users", {
      fullName: args.fullName,
      phoneE164: args.phoneE164,
      role: args.role as "customer" | "driver" | "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get user by id (for "me" – app passes stored userId).
 */
export const getMe = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get user by phone (for sign-in lookup).
 */
export const getByPhone = query({
  args: { phoneE164: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneE164", args.phoneE164))
      .first();
  },
});

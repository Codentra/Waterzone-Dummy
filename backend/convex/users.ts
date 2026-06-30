import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

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

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneE164: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver", "admin"]);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (args.phoneE164 && args.phoneE164 !== user.phoneE164) {
      const clash = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phoneE164", args.phoneE164!))
        .first();
      if (clash) throw new Error("Phone already in use");
    }

    await ctx.db.patch(args.userId, {
      ...(args.fullName !== undefined ? { fullName: args.fullName.trim() } : {}),
      ...(args.email !== undefined ? { email: args.email.trim() } : {}),
      ...(args.phoneE164 !== undefined ? { phoneE164: args.phoneE164.trim() } : {}),
      updatedAt: Date.now(),
    });
  },
});

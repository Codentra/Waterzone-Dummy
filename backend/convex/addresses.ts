import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

const geo = v.object({ lat: v.number(), lng: v.number() });

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver", "admin"]);
    return await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    label: v.string(),
    addressText: v.string(),
    landmark: v.optional(v.string()),
    instructions: v.optional(v.string()),
    geo: v.optional(geo),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "admin"]);
    const now = Date.now();
    const makeDefault = args.isDefault ?? false;

    if (makeDefault) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      for (const addr of existing) {
        if (addr.isDefault) await ctx.db.patch(addr._id, { isDefault: false, updatedAt: now });
      }
    }

    return await ctx.db.insert("addresses", {
      userId: args.userId,
      label: args.label.trim(),
      addressText: args.addressText.trim(),
      landmark: args.landmark?.trim(),
      instructions: args.instructions?.trim(),
      geo: args.geo,
      isDefault: makeDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    addressId: v.id("addresses"),
    label: v.optional(v.string()),
    addressText: v.optional(v.string()),
    landmark: v.optional(v.string()),
    instructions: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "admin"]);
    const addr = await ctx.db.get(args.addressId);
    if (!addr || addr.userId !== args.userId) throw new Error("Address not found");

    const now = Date.now();
    if (args.isDefault) {
      const all = await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      for (const a of all) {
        if (a.isDefault) await ctx.db.patch(a._id, { isDefault: false, updatedAt: now });
      }
    }

    await ctx.db.patch(args.addressId, {
      ...(args.label !== undefined ? { label: args.label.trim() } : {}),
      ...(args.addressText !== undefined ? { addressText: args.addressText.trim() } : {}),
      ...(args.landmark !== undefined ? { landmark: args.landmark.trim() } : {}),
      ...(args.instructions !== undefined ? { instructions: args.instructions.trim() } : {}),
      ...(args.isDefault !== undefined ? { isDefault: args.isDefault } : {}),
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    addressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "admin"]);
    const addr = await ctx.db.get(args.addressId);
    if (!addr || addr.userId !== args.userId) throw new Error("Address not found");
    await ctx.db.delete(args.addressId);
  },
});

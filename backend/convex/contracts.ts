import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

const geo = v.object({ lat: v.number(), lng: v.number() });

export const listByCustomer = query({
  args: { customerId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer", "admin"]);
    return await ctx.db
      .query("contracts")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const createDraft = mutation({
  args: {
    customerId: v.id("users"),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    litres: v.number(),
    addressText: v.string(),
    geo: v.optional(geo),
    preferredTime: v.string(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const now = Date.now();
    return await ctx.db.insert("contracts", {
      customerId: args.customerId,
      frequency: args.frequency,
      litres: args.litres,
      addressText: args.addressText.trim(),
      geo: args.geo,
      preferredTime: args.preferredTime,
      startDate: args.startDate,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateContact = mutation({
  args: {
    customerId: v.id("users"),
    contractId: v.id("contracts"),
    contactName: v.string(),
    contactPhone: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const c = await ctx.db.get(args.contractId);
    if (!c || c.customerId !== args.customerId) throw new Error("Contract not found");
    await ctx.db.patch(args.contractId, {
      contactName: args.contactName.trim(),
      contactPhone: args.contactPhone.trim(),
      updatedAt: Date.now(),
    });
  },
});

export const activate = mutation({
  args: {
    customerId: v.id("users"),
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const c = await ctx.db.get(args.contractId);
    if (!c || c.customerId !== args.customerId) throw new Error("Contract not found");
    await ctx.db.patch(args.contractId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

export const pause = mutation({
  args: {
    customerId: v.id("users"),
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const c = await ctx.db.get(args.contractId);
    if (!c || c.customerId !== args.customerId) throw new Error("Contract not found");
    await ctx.db.patch(args.contractId, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: {
    customerId: v.id("users"),
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const c = await ctx.db.get(args.contractId);
    if (!c || c.customerId !== args.customerId) throw new Error("Contract not found");
    await ctx.db.patch(args.contractId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

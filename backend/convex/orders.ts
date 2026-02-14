import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

const geo = v.object({ lat: v.number(), lng: v.number() });

/**
 * Customer: create order.
 */
export const createOrder = mutation({
  args: {
    customerId: v.id("users"),
    litres: v.number(),
    addressText: v.string(),
    geo: v.optional(geo),
    notes: v.optional(v.string()),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.customerId, ["customer"]);
    const now = Date.now();
    return await ctx.db.insert("orders", {
      customerId: args.customerId,
      litres: args.litres,
      addressText: args.addressText,
      geo: args.geo,
      notes: args.notes,
      status: "requested",
      paymentMethod: args.paymentMethod,
      paymentStatus: "unpaid",
      requestedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Assign a driver to an order. Caller must be the customer who placed the order (or admin).
 * Simple: pick first online approved driver.
 */
export const assignDriver = mutation({
  args: {
    orderId: v.id("orders"),
    callerUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.callerUserId, ["customer", "admin"]);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "requested") throw new Error("Order already assigned or completed");
    if (order.assignedDriverId) throw new Error("Order already has driver");
    const user = await ctx.db.get(args.callerUserId);
    if (user?.role === "customer" && order.customerId !== args.callerUserId)
      throw new Error("Only the customer who placed the order can assign a driver");

    const online = await ctx.db
      .query("driverStatus")
      .withIndex("online_drivers", (q) => q.eq("isOnline", true))
      .collect();
    let driverId: typeof order.assignedDriverId = undefined;
    for (const s of online) {
      const driver = await ctx.db.get(s.driverId);
      if (driver?.verificationStatus === "approved") {
        driverId = s.driverId;
        break;
      }
    }
    if (!driverId) throw new Error("No online driver available");

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      assignedDriverId: driverId,
      status: "assigned",
      assignedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Driver: accept order.
 */
export const acceptOrder = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.assignedDriverId !== driver._id) throw new Error("Order not assigned to you");
    if (order.status !== "assigned") throw new Error("Order not in assigned state");

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Driver: set order en route.
 */
export const setEnroute = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.assignedDriverId !== driver._id) throw new Error("Order not assigned to you");
    if (order.status !== "accepted") throw new Error("Order must be accepted first");

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "enroute",
      enrouteAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Driver: mark order delivered.
 */
export const markDelivered = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.assignedDriverId !== driver._id) throw new Error("Order not assigned to you");
    if (order.status !== "enroute") throw new Error("Order must be en route first");

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "delivered",
      deliveredAt: now,
      updatedAt: now,
      paymentStatus: "paid",
    });
  },
});

/**
 * Customer or admin: cancel order.
 */
export const cancelOrder = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await requireUserRole(ctx.db, args.userId, ["customer", "admin"]);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (user.role === "customer" && order.customerId !== args.userId)
      throw new Error("Not your order");
    if (["delivered", "cancelled"].includes(order.status))
      throw new Error("Order cannot be cancelled");

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Customer: list my orders (active first, then by updated).
 */
export const listByCustomer = query({
  args: { customerId: v.id("users") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
    const active = ["requested", "assigned", "accepted", "enroute"];
    return orders.sort((a, b) => {
      const aActive = active.includes(a.status);
      const bActive = active.includes(b.status);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  },
});

/**
 * Driver: list orders assigned to me (offered/assigned/accepted/enroute).
 */
export const listByDriver = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_driver", (q) => q.eq("assignedDriverId", args.driverId))
      .order("desc")
      .collect();
  },
});

/**
 * Get single order (for tracking).
 */
export const get = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => ctx.db.get(args.orderId),
});

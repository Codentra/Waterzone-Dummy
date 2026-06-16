import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getActivePricingConfig, roundMoney } from "./pricingHelpers";
import { requireUserRole } from "./helpers";

/** Driver: commission summary and unsettled orders. */
export const getDriverSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");

    const config = await getActivePricingConfig(ctx.db);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_driver", (q) => q.eq("assignedDriverId", driver._id))
      .collect();

    const now = Date.now();
    const unsettled = orders.filter(
      (o) =>
        o.status === "delivered" &&
        o.paymentStatus === "paid" &&
        (o.fee ?? 0) > 0 &&
        !o.commissionSettledAt
    );

    const outstanding = roundMoney(unsettled.reduce((sum, o) => sum + (o.fee ?? 0), 0));
    const overdue = unsettled.filter((o) => (o.commissionDueAt ?? 0) <= now);
    const overdueAmount = roundMoney(overdue.reduce((sum, o) => sum + (o.fee ?? 0), 0));

    const pendingSettlements = await ctx.db
      .query("commissionSettlements")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .collect();

    const pendingReview = pendingSettlements
      .filter((s) => s.status === "pending")
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      currency: config.currency,
      settlementCycleDays: config.settlementCycleDays,
      commissionPercent: config.platformCommissionPercent,
      outstanding,
      overdueAmount,
      overdueCount: overdue.length,
      pendingReview: roundMoney(pendingReview),
      unsettledOrders: unsettled.map((o) => ({
        orderId: o._id,
        litres: o.litres,
        total: o.total ?? 0,
        commission: o.fee ?? 0,
        deliveredAt: o.deliveredAt,
        commissionDueAt: o.commissionDueAt,
        isOverdue: (o.commissionDueAt ?? 0) <= now,
      })),
    };
  },
});

/** Driver: submit commission payment for unsettled orders. */
export const submitPayment = mutation({
  args: {
    userId: v.id("users"),
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    if (args.orderIds.length === 0) throw new Error("Select at least one order");

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");

    const config = await getActivePricingConfig(ctx.db);
    let amount = 0;
    const settledOrderIds: typeof args.orderIds = [];

    for (const orderId of args.orderIds) {
      const order = await ctx.db.get(orderId);
      if (!order) throw new Error("Order not found");
      if (order.assignedDriverId !== driver._id) throw new Error("Order not assigned to you");
      if (order.status !== "delivered" || order.paymentStatus !== "paid") {
        throw new Error("Order must be delivered and paid");
      }
      if (order.commissionSettledAt) throw new Error("Commission already settled for an order");
      const commission = order.fee ?? 0;
      if (commission <= 0) throw new Error("No commission due on an order");
      amount += commission;
      settledOrderIds.push(orderId);
    }

    const existingPending = await ctx.db
      .query("commissionSettlements")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .collect();
    if (existingPending.some((s) => s.status === "pending")) {
      throw new Error("You already have a pending commission payment awaiting confirmation");
    }

    return await ctx.db.insert("commissionSettlements", {
      driverId: driver._id,
      userId: args.userId,
      amount: roundMoney(amount),
      currency: config.currency,
      orderIds: settledOrderIds,
      status: "pending",
      submittedAt: Date.now(),
    });
  },
});

/** Driver: list commission settlement history. */
export const listMySettlements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const settlements = await ctx.db
      .query("commissionSettlements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return settlements;
  },
});

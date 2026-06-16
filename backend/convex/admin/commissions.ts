import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getActivePricingConfig, roundMoney } from "../pricingHelpers";

/** Admin: commission overview KPIs. */
export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const config = await getActivePricingConfig(ctx.db);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "paid"))
      .collect();

    const now = Date.now();
    const delivered = orders.filter((o) => o.status === "delivered");
    const totalCommission = roundMoney(delivered.reduce((sum, o) => sum + (o.fee ?? 0), 0));
    const settledCommission = roundMoney(
      delivered
        .filter((o) => o.commissionSettledAt)
        .reduce((sum, o) => sum + (o.fee ?? 0), 0)
    );
    const outstandingCommission = roundMoney(totalCommission - settledCommission);
    const overdueCommission = roundMoney(
      delivered
        .filter(
          (o) =>
            !o.commissionSettledAt &&
            (o.fee ?? 0) > 0 &&
            (o.commissionDueAt ?? 0) <= now
        )
        .reduce((sum, o) => sum + (o.fee ?? 0), 0)
    );

    const pendingSettlements = await ctx.db
      .query("commissionSettlements")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      currency: config.currency,
      settlementCycleDays: config.settlementCycleDays,
      commissionPercent: config.platformCommissionPercent,
      totalCommission,
      settledCommission,
      outstandingCommission,
      overdueCommission,
      pendingSettlementCount: pendingSettlements.length,
      pendingSettlementAmount: roundMoney(
        pendingSettlements.reduce((sum, s) => sum + s.amount, 0)
      ),
    };
  },
});

/** Admin: list pending commission settlements. */
export const listPendingSettlements = query({
  args: {},
  handler: async (ctx) => {
    const settlements = await ctx.db
      .query("commissionSettlements")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return Promise.all(
      settlements.map(async (s) => {
        const user = await ctx.db.get(s.userId);
        const driver = await ctx.db.get(s.driverId);
        return {
          ...s,
          driverName: user?.fullName ?? "Unknown",
          vehiclePlate: driver?.vehiclePlate ?? "",
        };
      })
    );
  },
});

/** Admin: list drivers with outstanding commission. */
export const listOutstandingByDriver = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "paid"))
      .collect();

    const now = Date.now();
    const unsettled = orders.filter(
      (o) =>
        o.status === "delivered" &&
        o.assignedDriverId &&
        (o.fee ?? 0) > 0 &&
        !o.commissionSettledAt
    );

    const byDriver = new Map<
      Id<"drivers">,
      { outstanding: number; overdue: number; orderCount: number }
    >();

    for (const order of unsettled) {
      const key = order.assignedDriverId!;
      const entry = byDriver.get(key) ?? {
        outstanding: 0,
        overdue: 0,
        orderCount: 0,
      };
      const commission = order.fee ?? 0;
      entry.outstanding += commission;
      entry.orderCount += 1;
      if ((order.commissionDueAt ?? 0) <= now) entry.overdue += commission;
      byDriver.set(key, entry);
    }

    const config = await getActivePricingConfig(ctx.db);
    const rows = await Promise.all(
      [...byDriver.entries()].map(async ([driverId, row]) => {
        const driver = await ctx.db.get(driverId);
        const user = driver ? await ctx.db.get(driver.userId) : null;
        return {
          driverId,
          driverName: user?.fullName ?? "Unknown",
          vehiclePlate: driver?.vehiclePlate ?? "",
          outstanding: roundMoney(row.outstanding),
          overdue: roundMoney(row.overdue),
          orderCount: row.orderCount,
          currency: config.currency,
        };
      })
    );

    return rows.sort((a, b) => b.outstanding - a.outstanding);
  },
});

/** Admin: confirm driver commission payment. */
export const confirmSettlement = mutation({
  args: {
    settlementId: v.id("commissionSettlements"),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) throw new Error("Settlement not found");
    if (settlement.status !== "pending") throw new Error("Settlement is not pending");

    const now = Date.now();
    for (const orderId of settlement.orderIds) {
      const order = await ctx.db.get(orderId);
      if (!order) continue;
      await ctx.db.patch(orderId, {
        commissionSettledAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.settlementId, {
      status: "confirmed",
      confirmedAt: now,
      confirmedByAdminId: args.adminUserId,
    });
  },
});

/** Admin: mark commission settled for specific orders (manual). */
export const markOrdersSettled = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const orderId of args.orderIds) {
      const order = await ctx.db.get(orderId);
      if (!order) throw new Error("Order not found");
      if (order.status !== "delivered") throw new Error("Order must be delivered");
      if (!order.fee || order.fee <= 0) throw new Error("No commission on order");
      if (order.commissionSettledAt) continue;
      await ctx.db.patch(orderId, {
        commissionSettledAt: now,
        updatedAt: now,
      });
    }
  },
});

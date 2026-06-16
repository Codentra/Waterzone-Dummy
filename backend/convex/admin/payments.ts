import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { creditWallet, debitWallet, getActivePricingConfig } from "../pricingHelpers";

/** Payments dashboard KPIs. */
export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const paidOrders = await ctx.db
      .query("orders")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "paid"))
      .collect();
    const refundedOrders = await ctx.db
      .query("orders")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "refunded"))
      .collect();
    const pendingPayouts = await ctx.db
      .query("payoutRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const wallets = await ctx.db.query("walletAccounts").collect();

    const cashRevenue = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const platformCommission = paidOrders.reduce((sum, o) => sum + (o.fee ?? 0), 0);
    const settledCommission = paidOrders
      .filter((o) => o.commissionSettledAt)
      .reduce((sum, o) => sum + (o.fee ?? 0), 0);
    const walletLiability = wallets.reduce((sum, w) => sum + w.balance, 0);

    return {
      cashRevenue,
      platformCommission,
      settledCommission,
      outstandingCommission: platformCommission - settledCommission,
      paidOrderCount: paidOrders.length,
      refundedOrderCount: refundedOrders.length,
      pendingPayoutCount: pendingPayouts.length,
      pendingPayoutAmount: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
      walletLiability,
      currency: (await getActivePricingConfig(ctx.db)).currency,
    };
  },
});

/** Admin: cash payment history + wallet movements. */
export const listHistory = query({
  args: {
    paymentStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const orders = args.paymentStatus
      ? await ctx.db
          .query("orders")
          .withIndex("by_payment_status", (q) =>
            q.eq("paymentStatus", args.paymentStatus!)
          )
          .order("desc")
          .take(limit)
      : await ctx.db.query("orders").order("desc").take(limit);

    const cashOrders = orders.filter((o) => o.paymentMethod === "cash");

    const orderRows = await Promise.all(
      cashOrders.map(async (order) => {
        const customer = await ctx.db.get(order.customerId);
        let driverName: string | null = null;
        if (order.assignedDriverId) {
          const driver = await ctx.db.get(order.assignedDriverId);
          if (driver) {
            const driverUser = await ctx.db.get(driver.userId);
            driverName = driverUser?.fullName ?? null;
          }
        }
        return {
          kind: "order" as const,
          orderId: order._id,
          customerName: customer?.fullName ?? "Unknown",
          driverName,
          litres: order.litres,
          total: order.total ?? 0,
          commission: order.fee ?? 0,
          commissionSettled: !!order.commissionSettledAt,
          commissionDueAt: order.commissionDueAt,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          paidAt: order.paidAt ?? order.cashReceivedAt ?? order.deliveredAt,
          createdAt: order.requestedAt,
        };
      })
    );

    const walletTxns = await ctx.db.query("walletTransactions").order("desc").take(limit);
    const walletRows = await Promise.all(
      walletTxns.map(async (txn) => {
        const user = await ctx.db.get(txn.userId);
        return {
          kind: "wallet" as const,
          transactionId: txn._id,
          userName: user?.fullName ?? "Unknown",
          type: txn.type,
          amount: txn.amount,
          reason: txn.reason,
          orderId: txn.orderId,
          createdAt: txn.createdAt,
        };
      })
    );

    const combined = [...orderRows, ...walletRows].sort((a, b) => {
      const aTime = a.kind === "order" ? (a.paidAt ?? a.createdAt) : a.createdAt;
      const bTime = b.kind === "order" ? (b.paidAt ?? b.createdAt) : b.createdAt;
      return bTime - aTime;
    });
    return combined.slice(0, limit);
  },
});

/** Admin: order payment detail. */
export const getOrderPaymentDetail = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    const customer = await ctx.db.get(order.customerId);
    let driver = null;
    let driverUser = null;
    if (order.assignedDriverId) {
      driver = await ctx.db.get(order.assignedDriverId);
      if (driver) driverUser = await ctx.db.get(driver.userId);
    }
    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();
    return {
      order,
      customer,
      driver,
      driverUser,
      transactions,
      timeline: [
        { label: "Requested", at: order.requestedAt },
        { label: "Assigned", at: order.assignedAt },
        { label: "Accepted", at: order.acceptedAt },
        { label: "En route", at: order.enrouteAt },
        { label: "Delivered", at: order.deliveredAt },
        { label: "Cash received", at: order.cashReceivedAt },
        { label: "Paid", at: order.paidAt },
      ].filter((e) => e.at != null),
    };
  },
});

/** Admin: record cash refund. */
export const processRefund = mutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus !== "paid") {
      throw new Error("Only paid orders can be refunded");
    }
    if (args.amount <= 0) throw new Error("Refund amount must be positive");
    const maxRefund = order.total ?? args.amount;
    if (args.amount > maxRefund) throw new Error("Refund exceeds order total");

    const config = await getActivePricingConfig(ctx.db);
    const now = Date.now();

    await creditWallet(ctx.db, {
      userId: order.customerId,
      amount: args.amount,
      currency: config.currency,
      reason: `refund: ${args.reason}`,
      orderId: args.orderId,
    });

    if (order.assignedDriverId) {
      const driver = await ctx.db.get(order.assignedDriverId);
      if (driver && order.driverEarnings) {
        const clawback = Math.min(order.driverEarnings, args.amount);
        if (clawback > 0) {
          await debitWallet(ctx.db, {
            userId: driver.userId,
            amount: clawback,
            currency: config.currency,
            reason: `refund_clawback: ${args.reason}`,
            orderId: args.orderId,
          });
        }
      }
    }

    await ctx.db.patch(args.orderId, {
      paymentStatus: "refunded",
      updatedAt: now,
    });
  },
});

/** Admin: list payout requests. */
export const listPayouts = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("paid")
      )
    ),
  },
  handler: async (ctx, args) => {
    const payouts = args.status
      ? await ctx.db
          .query("payoutRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("payoutRequests").order("desc").collect();

    return Promise.all(
      payouts.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const driver = await ctx.db.get(p.driverId);
        return { ...p, userName: user?.fullName ?? "Unknown", driverPlate: driver?.vehiclePlate };
      })
    );
  },
});

/** Admin: approve payout (debit wallet, mark paid). */
export const approvePayout = mutation({
  args: {
    payoutId: v.id("payoutRequests"),
    providerRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Payout not found");
    if (payout.status !== "pending") throw new Error("Payout is not pending");

    await debitWallet(ctx.db, {
      userId: payout.userId,
      amount: payout.amount,
      currency: payout.currency,
      reason: "payout",
    });

    const now = Date.now();
    await ctx.db.patch(args.payoutId, {
      status: "paid",
      reviewedAt: now,
      providerRef: args.providerRef,
    });
  },
});

/** Admin: reject payout request. */
export const rejectPayout = mutation({
  args: {
    payoutId: v.id("payoutRequests"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Payout not found");
    if (payout.status !== "pending") throw new Error("Payout is not pending");

    await ctx.db.patch(args.payoutId, {
      status: "rejected",
      reviewedAt: Date.now(),
      rejectionReason: args.rejectionReason,
    });
  },
});

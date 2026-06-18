import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getActivePricingConfig } from "../pricingHelpers";
import type { Doc, Id } from "../_generated/dataModel";

const ACTIVE_STATUSES = ["requested", "assigned", "accepted", "enroute"] as const;

const filterValidator = v.optional(
  v.union(
    v.literal("active"),
    v.literal("delivered"),
    v.literal("cancelled"),
    v.literal("all")
  )
);

function buildTimeline(order: Doc<"orders">) {
  const events = [
    { key: "requested", label: "Order placed", at: order.requestedAt },
    { key: "assigned", label: "Driver assigned", at: order.assignedAt },
    { key: "accepted", label: "Driver accepted", at: order.acceptedAt },
    { key: "enroute", label: "En route", at: order.enrouteAt },
    { key: "delivered", label: "Delivered", at: order.deliveredAt },
    { key: "cash", label: "Cash received", at: order.cashReceivedAt },
    { key: "paid", label: "Payment recorded", at: order.paidAt },
    { key: "cancelled", label: "Cancelled", at: order.cancelledAt },
  ];
  return events.filter((e) => e.at != null);
}

async function resolveDriverLabel(
  ctx: { db: { get: (id: Id<"drivers"> | Id<"users">) => Promise<Doc<"drivers"> | Doc<"users"> | null> } },
  driverId: Id<"drivers"> | undefined
) {
  if (!driverId) return null;
  const driver = (await ctx.db.get(driverId)) as Doc<"drivers"> | null;
  if (!driver) return null;
  const user = (await ctx.db.get(driver.userId)) as Doc<"users"> | null;
  return {
    name: user?.fullName ?? "Unknown",
    plate: driver.vehiclePlate,
  };
}

/** List orders for admin ops console. */
export const listOrders = query({
  args: { filter: filterValidator },
  handler: async (ctx, args) => {
    const filter = args.filter ?? "active";
    const allOrders = await ctx.db.query("orders").collect();
    allOrders.sort((a, b) => b.requestedAt - a.requestedAt);

    const filtered =
      filter === "all"
        ? allOrders
        : filter === "active"
          ? allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status as (typeof ACTIVE_STATUSES)[number]))
          : allOrders.filter((o) => o.status === filter);

    const config = await getActivePricingConfig(ctx.db);
    const currency = config.currency;

    const orders = await Promise.all(
      filtered.map(async (order) => {
        const customer = await ctx.db.get(order.customerId);
        const driver = await resolveDriverLabel(ctx, order.assignedDriverId);
        return {
          orderId: order._id,
          customerName: customer?.fullName ?? "Unknown",
          customerPhone: customer?.phoneE164 ?? "",
          litres: order.litres,
          total: order.total ?? 0,
          currency,
          addressText: order.addressText,
          driverName: driver?.name ?? null,
          driverPlate: driver?.plate ?? null,
          status: order.status,
          paymentStatus: order.paymentStatus,
          requestedAt: order.requestedAt,
        };
      })
    );

    const counts = {
      active: allOrders.filter((o) =>
        ACTIVE_STATUSES.includes(o.status as (typeof ACTIVE_STATUSES)[number])
      ).length,
      delivered: allOrders.filter((o) => o.status === "delivered").length,
      cancelled: allOrders.filter((o) => o.status === "cancelled").length,
      all: allOrders.length,
    };

    return { orders, counts, currency };
  },
});

/** Full order detail with lifecycle timeline. */
export const getOrderDetail = query({
  args: { orderId: v.id("orders") },
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

    const config = await getActivePricingConfig(ctx.db);

    return {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      litres: order.litres,
      addressText: order.addressText,
      geo: order.geo,
      notes: order.notes,
      total: order.total ?? 0,
      fee: order.fee ?? 0,
      driverEarnings: order.driverEarnings ?? 0,
      currency: config.currency,
      commissionDueAt: order.commissionDueAt,
      commissionSettledAt: order.commissionSettledAt,
      cashReceivedAmount: order.cashReceivedAmount,
      customer: customer
        ? {
            name: customer.fullName,
            phone: customer.phoneE164,
          }
        : null,
      driver: driver
        ? {
            name: driverUser?.fullName ?? "Unknown",
            phone: driverUser?.phoneE164 ?? "",
            plate: driver.vehiclePlate,
            vehicleType: driver.vehicleType,
          }
        : null,
      timeline: buildTimeline(order),
      canCancel: !["delivered", "cancelled"].includes(order.status),
    };
  },
});

/** Admin: force-cancel a non-delivered order. */
export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (["delivered", "cancelled"].includes(order.status)) {
      throw new Error("Order cannot be cancelled");
    }

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    });
  },
});

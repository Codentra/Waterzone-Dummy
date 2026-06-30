import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import { requireUserRole } from "./helpers";
import { createNotification } from "./notifications";

const CHAT_READ_STATUSES = new Set(["accepted", "enroute", "delivered"]);
const CHAT_SEND_STATUSES = new Set(["accepted", "enroute"]);

async function resolveOrderAccess(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  orderId: Id<"orders">,
  options?: { requireSend?: boolean }
) {
  const user = await db.get(userId);
  if (!user) throw new Error("User not found");

  const order = await db.get(orderId);
  if (!order) throw new Error("Order not found");

  const allowedStatuses = options?.requireSend ? CHAT_SEND_STATUSES : CHAT_READ_STATUSES;
  if (!allowedStatuses.has(order.status)) {
    if (options?.requireSend) {
      throw new Error("Chat is only available while the delivery is active");
    }
    throw new Error("Chat is available after the driver accepts the order");
  }

  let isParticipant = false;
  if (user.role === "customer" && order.customerId === userId) {
    isParticipant = true;
  }
  if (user.role === "driver" && order.assignedDriverId) {
    const driver = await db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (driver && order.assignedDriverId === driver._id) {
      isParticipant = true;
    }
  }

  if (!isParticipant) throw new Error("Forbidden");
  return { order, user };
}

async function getOtherParty(
  db: GenericDatabaseReader<DataModel>,
  order: DataModel["orders"]["document"],
  viewerUserId: Id<"users">
) {
  const viewer = await db.get(viewerUserId);
  if (!viewer) throw new Error("User not found");

  if (viewer.role === "customer") {
    if (!order.assignedDriverId) return null;
    const driver = await db.get(order.assignedDriverId);
    if (!driver) return null;
    const driverUser = await db.get(driver.userId);
    if (!driverUser) return null;
    return {
      userId: driverUser._id,
      fullName: driverUser.fullName,
      phoneE164: driverUser.phoneE164,
      role: "driver" as const,
      vehiclePlate: driver.vehiclePlate,
    };
  }

  const customer = await db.get(order.customerId);
  if (!customer) return null;
  return {
    userId: customer._id,
    fullName: customer.fullName,
    phoneE164: customer.phoneE164,
    role: "customer" as const,
  };
}

export const listMessages = query({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver"]);
    const { order, user } = await resolveOrderAccess(ctx.db, args.userId, args.orderId);
    const messages = await ctx.db
      .query("orderMessages")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();
    messages.sort((a, b) => a.createdAt - b.createdAt);

    const otherParty = await getOtherParty(ctx.db, order, args.userId);
    return {
      messages,
      canSend: CHAT_SEND_STATUSES.has(order.status),
      viewerRole: user.role,
      order: {
        _id: order._id,
        status: order.status,
        litres: order.litres,
        addressText: order.addressText,
      },
      otherParty,
    };
  },
});

export const sendMessage = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver"]);
    const trimmed = args.body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 2000) throw new Error("Message is too long");

    const { order } = await resolveOrderAccess(ctx.db, args.userId, args.orderId, {
      requireSend: true,
    });

    const now = Date.now();
    const messageId = await ctx.db.insert("orderMessages", {
      orderId: args.orderId,
      senderUserId: args.userId,
      body: trimmed,
      createdAt: now,
    });

    const otherParty = await getOtherParty(ctx.db, order, args.userId);
    if (otherParty) {
      await createNotification(ctx.db, otherParty.userId, "order_message", {
        orderId: args.orderId,
        messageId,
        preview: trimmed.slice(0, 120),
      });
    }

    return messageId;
  },
});

export const getContactSummary = query({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver"]);
    try {
      const { order } = await resolveOrderAccess(ctx.db, args.userId, args.orderId);
      const otherParty = await getOtherParty(ctx.db, order, args.userId);
      return {
        canChat: CHAT_READ_STATUSES.has(order.status),
        canSend: CHAT_SEND_STATUSES.has(order.status),
        otherParty,
      };
    } catch {
      return null;
    }
  },
});

export const listThreads = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUserRole(ctx.db, args.userId, ["customer", "driver"]);

    let orders;
    if (user.role === "customer") {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_customer", (q) => q.eq("customerId", args.userId))
        .order("desc")
        .collect();
    } else {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
      if (!driver) return [];
      orders = await ctx.db
        .query("orders")
        .withIndex("by_driver", (q) => q.eq("assignedDriverId", driver._id))
        .order("desc")
        .collect();
    }

    const eligible = orders.filter((o) => CHAT_READ_STATUSES.has(o.status));
    const threads = [];

    for (const order of eligible) {
      const messages = await ctx.db
        .query("orderMessages")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();
      messages.sort((a, b) => b.createdAt - a.createdAt);
      const last = messages[0];
      const otherParty = await getOtherParty(ctx.db, order, args.userId);

      threads.push({
        orderId: order._id,
        status: order.status,
        litres: order.litres,
        addressText: order.addressText,
        updatedAt: last?.createdAt ?? order.acceptedAt ?? order.updatedAt,
        messageCount: messages.length,
        lastMessage: last
          ? { body: last.body, createdAt: last.createdAt, senderUserId: last.senderUserId }
          : null,
        otherParty,
      });
    }

    threads.sort((a, b) => b.updatedAt - a.updatedAt);
    return threads;
  },
});

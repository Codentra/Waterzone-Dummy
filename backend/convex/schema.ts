import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const geo = v.object({ lat: v.number(), lng: v.number() });

/**
 * Waterzone Convex schema
 * Backend for customer app, driver app, and admin dashboard.
 */
export default defineSchema({
  users: defineTable({
    role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin")),
    fullName: v.string(),
    phoneE164: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_phone", ["phoneE164"]).index("by_role", ["role"]),

  drivers: defineTable({
    userId: v.id("users"),
    vehiclePlate: v.string(),
    vehicleType: v.string(),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    docsMetadata: v.string(),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_verification", ["verificationStatus"]),

  driverStatus: defineTable({
    driverId: v.id("drivers"),
    isOnline: v.boolean(),
    lastLocation: v.optional(geo),
    lastSeenAt: v.number(),
    updatedAt: v.number(),
  }).index("by_driver", ["driverId"]).index("online_drivers", ["isOnline"]),

  orders: defineTable({
    customerId: v.id("users"),
    assignedDriverId: v.optional(v.id("drivers")),
    litres: v.number(),
    addressText: v.string(),
    geo: v.optional(geo),
    notes: v.optional(v.string()),
    status: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.string(),
    total: v.optional(v.number()),
    fee: v.optional(v.number()),
    driverEarnings: v.optional(v.number()),
    requestedAt: v.number(),
    assignedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    enrouteAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_driver", ["assignedDriverId"])
    .index("by_status", ["status"])
    .index("by_updated", ["updatedAt"]),

  paymentIntents: defineTable({
    orderId: v.id("orders"),
    customerId: v.id("users"),
    provider: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    providerRef: v.optional(v.string()),
    pollUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["orderId"]).index("by_status", ["status"]),

  walletAccounts: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    currency: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  walletTransactions: defineTable({
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    type: v.union(v.literal("debit"), v.literal("credit")),
    amount: v.number(),
    reason: v.string(),
    provider: v.string(),
    status: v.string(),
    receiptData: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_order", ["orderId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    payload: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_status", ["status"]),

  addresses: defineTable({
    userId: v.id("users"),
    label: v.string(),
    addressText: v.string(),
    geo: v.optional(geo),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});

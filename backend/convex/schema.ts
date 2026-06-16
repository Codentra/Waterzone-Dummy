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
    commissionDueAt: v.optional(v.number()),
    commissionSettledAt: v.optional(v.number()),
    requestedAt: v.number(),
    assignedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    enrouteAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    cashReceivedAt: v.optional(v.number()),
    cashReceivedAmount: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_driver", ["assignedDriverId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_updated", ["updatedAt"]),

  pricingConfig: defineTable({
    key: v.literal("default"),
    bundleTiers: v.optional(
      v.array(
        v.object({
          litres: v.number(),
          price: v.number(),
        })
      )
    ),
    platformCommissionPercent: v.optional(v.number()),
    settlementCycleDays: v.optional(v.number()),
    currency: v.string(),
    updatedAt: v.number(),
    updatedByAdminId: v.optional(v.id("users")),
    // Legacy fields kept so older config rows still validate.
    pricePerLiter: v.optional(v.number()),
    vatPercent: v.optional(v.number()),
    platformFeePercent: v.optional(v.number()),
    volumeTiers: v.optional(
      v.array(
        v.object({
          minLitres: v.number(),
          discountPercent: v.number(),
        })
      )
    ),
  }).index("by_key", ["key"]),

  commissionSettlements: defineTable({
    driverId: v.id("drivers"),
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    orderIds: v.array(v.id("orders")),
    status: v.union(v.literal("pending"), v.literal("confirmed")),
    submittedAt: v.number(),
    confirmedAt: v.optional(v.number()),
    confirmedByAdminId: v.optional(v.id("users")),
  })
    .index("by_driver", ["driverId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  payoutRequests: defineTable({
    driverId: v.id("drivers"),
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("paid")
    ),
    requestedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedByAdminId: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
    providerRef: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_driver", ["driverId"])
    .index("by_user", ["userId"]),

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
    adminUserId: v.optional(v.id("users")),
    type: v.union(v.literal("debit"), v.literal("credit")),
    amount: v.number(),
    reason: v.string(),
    provider: v.string(),
    status: v.string(),
    receiptData: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_order", ["orderId"])
    .index("by_reason", ["reason"]),

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

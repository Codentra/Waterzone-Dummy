import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";
import type { DriverProfile } from "./driverValidators";
import {
  driverDocumentsValidator,
  driverProfileValidator,
  validateProfileText,
  verifyStorageIds,
} from "./driverValidators";

const geo = v.object({ lat: v.number(), lng: v.number() });

/**
 * Generate a Convex storage upload URL for driver document uploads.
 */
export const generateUploadUrl = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Register as driver with profile + document uploads. Starts as pending admin approval.
 */
export const registerDriver = mutation({
  args: {
    userId: v.id("users"),
    vehiclePlate: v.string(),
    vehicleType: v.string(),
    profile: driverProfileValidator,
    documents: driverDocumentsValidator,
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);

    const plate = args.vehiclePlate.trim();
    const type = args.vehicleType.trim();
    if (!plate || !type) throw new Error("Vehicle plate and type are required");

    validateProfileText(args.profile);
    await verifyStorageIds(ctx, args.documents);

    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const driverData = {
      vehiclePlate: plate,
      vehicleType: type,
      profile: args.profile,
      documents: args.documents,
      verificationStatus: "pending" as const,
      rejectionReason: undefined,
      updatedAt: now,
    };

    if (existing) {
      if (existing.verificationStatus === "approved") {
        return existing._id;
      }
      if (existing.verificationStatus === "pending") {
        throw new Error("Your application is already under review.");
      }
      await ctx.db.patch(existing._id, driverData);
      return existing._id;
    }

    const driverId = await ctx.db.insert("drivers", {
      userId: args.userId,
      ...driverData,
      createdAt: now,
    });

    await ctx.db.insert("driverStatus", {
      driverId,
      isOnline: false,
      lastSeenAt: now,
      updatedAt: now,
    });

    return driverId;
  },
});

/** Dev/demo: create or approve a driver without document uploads. */
export const ensureDemoDriver = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const now = Date.now();
    const demoProfile: DriverProfile = {
      nationalIdNumber: "DEMO-000",
      dateOfBirth: "1990-01-01",
      homeAddress: "Demo Address",
      emergencyContactName: "Demo Contact",
      emergencyContactPhone: "+263770000000",
      vehicleMakeModel: "Demo Tanker",
      tankCapacityLitres: 5000,
      vehicleColour: "Blue",
    };

    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      if (existing.verificationStatus !== "approved") {
        await ctx.db.patch(existing._id, {
          verificationStatus: "approved",
          rejectionReason: undefined,
          updatedAt: now,
        });
      }
      const status = await ctx.db
        .query("driverStatus")
        .withIndex("by_driver", (q) => q.eq("driverId", existing._id))
        .first();
      if (!status) {
        await ctx.db.insert("driverStatus", {
          driverId: existing._id,
          isOnline: false,
          lastSeenAt: now,
          updatedAt: now,
        });
      }
      return existing._id;
    }

    const driverId = await ctx.db.insert("drivers", {
      userId: args.userId,
      vehiclePlate: "DEMO-123",
      vehicleType: "Tanker",
      profile: demoProfile,
      verificationStatus: "approved",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("driverStatus", {
      driverId,
      isOnline: false,
      lastSeenAt: now,
      updatedAt: now,
    });

    return driverId;
  },
});

/**
 * Get driver record by user id.
 */
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Get driver status (online, lastLocation).
 */
export const getStatus = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("driverStatus")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .first();
  },
});

/**
 * Toggle online/offline and optionally update location.
 */
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.boolean(),
    lastLocation: v.optional(geo),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");
    if (driver.verificationStatus !== "approved") {
      throw new Error("Driver verification must be approved before going online");
    }
    const status = await ctx.db
      .query("driverStatus")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .first();
    if (!status) throw new Error("Driver status not found");
    const now = Date.now();
    await ctx.db.patch(status._id, {
      isOnline: args.isOnline,
      lastLocation: args.lastLocation ?? status.lastLocation,
      lastSeenAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update driver location (heartbeat). Driver-only.
 */
export const updateLocation = mutation({
  args: {
    userId: v.id("users"),
    lastLocation: geo,
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");
    if (driver.verificationStatus !== "approved") {
      throw new Error("Driver verification must be approved");
    }
    const status = await ctx.db
      .query("driverStatus")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .first();
    if (!status) throw new Error("Driver status not found");
    const now = Date.now();
    await ctx.db.patch(status._id, {
      lastLocation: args.lastLocation,
      lastSeenAt: now,
      updatedAt: now,
    });
  },
});

/**
 * List online drivers (for assignment). Returns driver id + status.
 */
export const listOnline = query({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db
      .query("driverStatus")
      .withIndex("online_drivers", (q) => q.eq("isOnline", true))
      .collect();
    const results = await Promise.all(
      statuses.map(async (statusDoc) => {
        const driver = await ctx.db.get(statusDoc.driverId);
        if (!driver || driver.verificationStatus !== "approved") return null;
        return { driverId: statusDoc.driverId, driver, status: statusDoc };
      })
    );
    return results.filter(Boolean);
  },
});

/**
 * Admin: approve or reject driver.
 */
export const setVerification = mutation({
  args: {
    adminUserId: v.id("users"),
    driverId: v.id("drivers"),
    verificationStatus: v.union(v.literal("approved"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.adminUserId, ["admin"]);
    const driver = await ctx.db.get(args.driverId);
    if (!driver) throw new Error("Driver not found");
    const now = Date.now();
    await ctx.db.patch(args.driverId, {
      verificationStatus: args.verificationStatus,
      rejectionReason: args.rejectionReason,
      updatedAt: now,
    });
  },
});

export const updateVehicle = mutation({
  args: {
    userId: v.id("users"),
    vehiclePlate: v.string(),
    vehicleType: v.string(),
    vehicleMakeModel: v.optional(v.string()),
    tankCapacityLitres: v.optional(v.number()),
    vehicleColour: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) throw new Error("Driver not registered");
    if (!driver.profile) throw new Error("Complete driver profile first");

    const profile: DriverProfile = {
      nationalIdNumber: driver.profile.nationalIdNumber,
      dateOfBirth: driver.profile.dateOfBirth,
      homeAddress: driver.profile.homeAddress,
      emergencyContactName: driver.profile.emergencyContactName,
      emergencyContactPhone: driver.profile.emergencyContactPhone,
      vehicleMakeModel: args.vehicleMakeModel?.trim() ?? driver.profile.vehicleMakeModel,
      tankCapacityLitres: args.tankCapacityLitres ?? driver.profile.tankCapacityLitres,
      vehicleColour: args.vehicleColour?.trim() ?? driver.profile.vehicleColour,
    };

    await ctx.db.patch(driver._id, {
      vehiclePlate: args.vehiclePlate.trim(),
      vehicleType: args.vehicleType.trim(),
      profile,
      updatedAt: Date.now(),
    });
  },
});

export const getEarningsSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) return { totalEarnings: 0, tripCount: 0, currency: "USD" };

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_driver", (q) => q.eq("assignedDriverId", driver._id))
      .collect();

    const delivered = orders.filter((o) => o.status === "delivered");
    const totalEarnings = delivered.reduce((s, o) => s + (o.driverEarnings ?? 0), 0);
    return {
      totalEarnings,
      tripCount: delivered.length,
      currency: "USD",
    };
  },
});

function startOfUtcDay(ts: number) {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Driver dashboard: today's earnings, completed orders, acceptance rate, star average.
 */
export const getDashboardStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!driver) {
      return {
        todayEarnings: 0,
        completedToday: 0,
        acceptanceRate: 0,
        averageStars: 0,
        ratingCount: 0,
        currency: "USD",
      };
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_driver", (q) => q.eq("assignedDriverId", driver._id))
      .collect();

    const dayStart = startOfUtcDay(Date.now());
    const deliveredToday = orders.filter(
      (o) => o.status === "delivered" && o.deliveredAt != null && o.deliveredAt >= dayStart
    );
    const todayEarnings = deliveredToday.reduce((s, o) => s + (o.driverEarnings ?? 0), 0);

    const offered = orders.filter((o) => o.status !== "cancelled");
    const accepted = offered.filter((o) =>
      ["accepted", "enroute", "delivered"].includes(o.status)
    );
    const acceptanceRate =
      offered.length > 0 ? Math.round((accepted.length / offered.length) * 100) : 100;

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .collect();
    const averageStars =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
        : 0;

    return {
      todayEarnings,
      completedToday: deliveredToday.length,
      acceptanceRate,
      averageStars,
      ratingCount: ratings.length,
      currency: "USD",
    };
  },
});

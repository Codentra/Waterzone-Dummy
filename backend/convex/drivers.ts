import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserRole } from "./helpers";

const geo = v.object({ lat: v.number(), lng: v.number() });

/**
 * Register as driver (user must have role "driver"). Creates driver record and driverStatus.
 */
export const registerDriver = mutation({
  args: {
    userId: v.id("users"),
    vehiclePlate: v.string(),
    vehicleType: v.string(),
    docsMetadata: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["driver"]);
    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    // Auto-approved so no admin dashboard needed for logins
    const driverId = await ctx.db.insert("drivers", {
      userId: args.userId,
      vehiclePlate: args.vehiclePlate,
      vehicleType: args.vehicleType,
      verificationStatus: "approved",
      docsMetadata: args.docsMetadata,
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
 * Admin: approve or reject driver. (Stub – no OTP; admin identity not enforced here.)
 */
export const setVerification = mutation({
  args: {
    adminUserId: v.id("users"),
    driverId: v.id("drivers"),
    verificationStatus: v.union(
      v.literal("approved"),
      v.literal("rejected")
    ),
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

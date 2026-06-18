import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  getDriverUserSummary,
  resolveDocumentUrls,
} from "../driverValidators";

const verificationFilter = v.optional(
  v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("all")
  )
);

/** List drivers for admin queue with optional status filter. */
export const listDrivers = query({
  args: { verificationStatus: verificationFilter },
  handler: async (ctx, args) => {
    const filter = args.verificationStatus ?? "pending";
    const drivers =
      filter === "all"
        ? await ctx.db.query("drivers").collect()
        : await ctx.db
            .query("drivers")
            .withIndex("by_verification", (q) => q.eq("verificationStatus", filter))
            .collect();

    drivers.sort((a, b) => b.createdAt - a.createdAt);

    const rows = await Promise.all(drivers.map((d) => getDriverUserSummary(ctx.db, d)));

    const all = await ctx.db.query("drivers").collect();
    const counts = {
      pending: all.filter((d) => d.verificationStatus === "pending").length,
      approved: all.filter((d) => d.verificationStatus === "approved").length,
      rejected: all.filter((d) => d.verificationStatus === "rejected").length,
      all: all.length,
    };

    return { drivers: rows, counts };
  },
});

/** Full driver review payload with signed document URLs. */
export const getDriverReview = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) throw new Error("Driver not found");

    const user = await ctx.db.get(driver.userId);
    const status = await ctx.db
      .query("driverStatus")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .first();

    const documentUrls = await resolveDocumentUrls(ctx, driver.documents ?? undefined);

    return {
      driverId: driver._id,
      userId: driver.userId,
      fullName: user?.fullName ?? "Unknown",
      phoneE164: user?.phoneE164 ?? "",
      vehiclePlate: driver.vehiclePlate,
      vehicleType: driver.vehicleType,
      verificationStatus: driver.verificationStatus,
      rejectionReason: driver.rejectionReason,
      profile: driver.profile ?? null,
      documents: documentUrls,
      isOnline: status?.isOnline ?? false,
      createdAt: driver.createdAt,
      hasCompleteProfile: Boolean(driver.profile && driver.documents),
    };
  },
});

/** Approve a pending driver application. */
export const approveDriver = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) throw new Error("Driver not found");
    if (driver.verificationStatus === "approved") return;

    const now = Date.now();
    await ctx.db.patch(args.driverId, {
      verificationStatus: "approved",
      rejectionReason: undefined,
      updatedAt: now,
    });

    const status = await ctx.db
      .query("driverStatus")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .first();
    if (status) {
      await ctx.db.patch(status._id, { isOnline: false, updatedAt: now });
    }
  },
});

/** Reject a driver application with a required reason. */
export const rejectDriver = mutation({
  args: {
    driverId: v.id("drivers"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const reason = args.rejectionReason.trim();
    if (!reason) throw new Error("Rejection reason is required");

    const driver = await ctx.db.get(args.driverId);
    if (!driver) throw new Error("Driver not found");

    const now = Date.now();
    await ctx.db.patch(args.driverId, {
      verificationStatus: "rejected",
      rejectionReason: reason,
      updatedAt: now,
    });

    const status = await ctx.db
      .query("driverStatus")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .first();
    if (status?.isOnline) {
      await ctx.db.patch(status._id, { isOnline: false, updatedAt: now });
    }
  },
});

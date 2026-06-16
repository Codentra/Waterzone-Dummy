import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { DEFAULT_PRICING, validateBundleTiers } from "../pricingHelpers";

const bundleTierValidator = v.object({
  litres: v.number(),
  price: v.number(),
});

/** Full pricing config row including metadata. */
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .first();
    if (!row) {
      return {
        ...DEFAULT_PRICING,
        updatedAt: null,
        updatedByAdminId: null,
        isDefault: true,
        needsMigration: false,
      };
    }

    const hasBundles = Boolean(row.bundleTiers?.length);
    return {
      ...row,
      bundleTiers: hasBundles ? row.bundleTiers! : [...DEFAULT_PRICING.bundleTiers],
      platformCommissionPercent:
        row.platformCommissionPercent ??
        row.platformFeePercent ??
        DEFAULT_PRICING.platformCommissionPercent,
      settlementCycleDays:
        row.settlementCycleDays ?? DEFAULT_PRICING.settlementCycleDays,
      isDefault: !hasBundles,
      needsMigration: !hasBundles,
    };
  },
});

/** Save the standard bundle pricing (2500L/$35, 5000L/$45, 7500L/$65, 5% commission, 3-day settlement). */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const payload = {
      bundleTiers: validateBundleTiers([...DEFAULT_PRICING.bundleTiers]),
      platformCommissionPercent: DEFAULT_PRICING.platformCommissionPercent,
      settlementCycleDays: DEFAULT_PRICING.settlementCycleDays,
      currency: DEFAULT_PRICING.currency,
      updatedAt: now,
    };

    const existing = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("pricingConfig", { key: "default", ...payload });
  },
});

/** Update bundle pricing and commission settings. */
export const updateConfig = mutation({
  args: {
    bundleTiers: v.array(bundleTierValidator),
    platformCommissionPercent: v.number(),
    settlementCycleDays: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bundleTiers = validateBundleTiers(args.bundleTiers);
    if (args.platformCommissionPercent < 0 || args.platformCommissionPercent > 100) {
      throw new Error("Commission percent must be between 0 and 100");
    }
    const settlementCycleDays = args.settlementCycleDays ?? DEFAULT_PRICING.settlementCycleDays;
    if (settlementCycleDays < 1) {
      throw new Error("Settlement cycle must be at least 1 day");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .first();

    const payload = {
      bundleTiers,
      platformCommissionPercent: args.platformCommissionPercent,
      settlementCycleDays,
      currency: args.currency ?? "USD",
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("pricingConfig", { key: "default", ...payload });
  },
});

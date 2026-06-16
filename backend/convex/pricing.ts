import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  calculateOrderPricing,
  getActivePricingConfig,
} from "./pricingHelpers";

/** List available bundle tiers (customer app). */
export const listBundles = query({
  args: {},
  handler: async (ctx) => {
    const config = await getActivePricingConfig(ctx.db);
    return {
      bundles: config.bundleTiers,
      currency: config.currency,
      commissionPercent: config.platformCommissionPercent,
    };
  },
});

/** Preview order total for a bundle size (customer app). */
export const preview = query({
  args: { litres: v.number() },
  handler: async (ctx, args) => {
    const config = await getActivePricingConfig(ctx.db);
    return calculateOrderPricing(args.litres, config);
  },
});

/** Active pricing config (public read). */
export const getActive = query({
  args: {},
  handler: async (ctx) => getActivePricingConfig(ctx.db),
});

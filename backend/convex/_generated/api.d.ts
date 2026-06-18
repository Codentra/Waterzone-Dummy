/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_commissions from "../admin/commissions.js";
import type * as admin_drivers from "../admin/drivers.js";
import type * as admin_orders from "../admin/orders.js";
import type * as admin_payments from "../admin/payments.js";
import type * as admin_pricing from "../admin/pricing.js";
import type * as admin_wallets from "../admin/wallets.js";
import type * as commissions from "../commissions.js";
import type * as driverValidators from "../driverValidators.js";
import type * as drivers from "../drivers.js";
import type * as helpers from "../helpers.js";
import type * as orders from "../orders.js";
import type * as payouts from "../payouts.js";
import type * as pricing from "../pricing.js";
import type * as pricingHelpers from "../pricingHelpers.js";
import type * as users from "../users.js";
import type * as wallets from "../wallets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/commissions": typeof admin_commissions;
  "admin/drivers": typeof admin_drivers;
  "admin/orders": typeof admin_orders;
  "admin/payments": typeof admin_payments;
  "admin/pricing": typeof admin_pricing;
  "admin/wallets": typeof admin_wallets;
  commissions: typeof commissions;
  driverValidators: typeof driverValidators;
  drivers: typeof drivers;
  helpers: typeof helpers;
  orders: typeof orders;
  payouts: typeof payouts;
  pricing: typeof pricing;
  pricingHelpers: typeof pricingHelpers;
  users: typeof users;
  wallets: typeof wallets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

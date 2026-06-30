import type { GenericDatabaseReader, GenericDatabaseWriter } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

export type BundleTier = {
  litres: number;
  price: number;
};

export const DEFAULT_BUNDLE_TIERS: BundleTier[] = [
  { litres: 2500, price: 35 },
  { litres: 5000, price: 45 },
  { litres: 7500, price: 65 },
];

export const MIN_ORDER_LITRES = 2500;

export const DEFAULT_COMMISSION_PERCENT = 5;
export const DEFAULT_SETTLEMENT_CYCLE_DAYS = 3;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_PRICING = {
  bundleTiers: DEFAULT_BUNDLE_TIERS,
  platformCommissionPercent: DEFAULT_COMMISSION_PERCENT,
  settlementCycleDays: DEFAULT_SETTLEMENT_CYCLE_DAYS,
  currency: "USD",
} as const;

export type PricingBreakdown = {
  litres: number;
  total: number;
  commissionPercent: number;
  commission: number;
  driverEarnings: number;
  currency: string;
};

export type PricingConfigValues = {
  bundleTiers: BundleTier[];
  platformCommissionPercent: number;
  settlementCycleDays: number;
  currency: string;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function validateBundleTiers(tiers: BundleTier[]): BundleTier[] {
  if (tiers.length === 0) throw new Error("At least one bundle tier is required");

  const sorted = [...tiers].sort((a, b) => a.litres - b.litres);
  const seen = new Set<number>();

  for (const tier of sorted) {
    if (tier.litres <= 0) throw new Error("Bundle litres must be positive");
    if (tier.price <= 0) throw new Error("Bundle price must be positive");
    if (seen.has(tier.litres)) {
      throw new Error("Bundle tiers cannot share the same litre amount");
    }
    seen.add(tier.litres);
  }

  return sorted;
}

export function findBundleTier(
  litres: number,
  tiers: BundleTier[]
): BundleTier | null {
  return tiers.find((tier) => tier.litres === litres) ?? null;
}

export function calculateOrderPricing(
  litres: number,
  config: PricingConfigValues
): PricingBreakdown {
  const tiers = [...config.bundleTiers].sort((a, b) => a.litres - b.litres);
  const minLitres = tiers[0]?.litres ?? MIN_ORDER_LITRES;
  if (litres < minLitres) {
    throw new Error(`Minimum order is ${minLitres.toLocaleString()} L`);
  }

  const bundle = findBundleTier(litres, tiers);
  const baseTier = tiers[0];
  const total = bundle
    ? roundMoney(bundle.price)
    : roundMoney(litres * (baseTier.price / baseTier.litres));

  const commission = roundMoney(total * (config.platformCommissionPercent / 100));
  const driverEarnings = roundMoney(total - commission);

  return {
    litres,
    total,
    commissionPercent: config.platformCommissionPercent,
    commission,
    driverEarnings,
    currency: config.currency,
  };
}

export function commissionDueAt(deliveredAt: number, settlementCycleDays: number): number {
  return deliveredAt + settlementCycleDays * MS_PER_DAY;
}

export async function getActivePricingConfig(
  db: GenericDatabaseReader<DataModel>
): Promise<PricingConfigValues> {
  const row = await db
    .query("pricingConfig")
    .withIndex("by_key", (q) => q.eq("key", "default"))
    .first();
  if (!row) return { ...DEFAULT_PRICING };
  return {
    bundleTiers: row.bundleTiers?.length ? row.bundleTiers : [...DEFAULT_BUNDLE_TIERS],
    platformCommissionPercent: row.platformCommissionPercent ?? DEFAULT_COMMISSION_PERCENT,
    settlementCycleDays: row.settlementCycleDays ?? DEFAULT_SETTLEMENT_CYCLE_DAYS,
    currency: row.currency,
  };
}

export async function ensureWallet(
  db: GenericDatabaseWriter<DataModel>,
  userId: Id<"users">,
  currency: string
) {
  const existing = await db
    .query("walletAccounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) return existing;
  const now = Date.now();
  const id = await db.insert("walletAccounts", {
    userId,
    balance: 0,
    currency,
    updatedAt: now,
  });
  return (await db.get(id))!;
}

export async function creditWallet(
  db: GenericDatabaseWriter<DataModel>,
  args: {
    userId: Id<"users">;
    amount: number;
    currency: string;
    reason: string;
    orderId?: Id<"orders">;
    adminUserId?: Id<"users">;
  }
) {
  const wallet = await ensureWallet(db, args.userId, args.currency);
  const now = Date.now();
  const balance = roundMoney(wallet.balance + args.amount);
  await db.patch(wallet._id, { balance, updatedAt: now });
  await db.insert("walletTransactions", {
    userId: args.userId,
    orderId: args.orderId,
    adminUserId: args.adminUserId,
    type: "credit",
    amount: args.amount,
    reason: args.reason,
    provider: "cash",
    status: "completed",
    createdAt: now,
  });
}

export async function debitWallet(
  db: GenericDatabaseWriter<DataModel>,
  args: {
    userId: Id<"users">;
    amount: number;
    currency: string;
    reason: string;
    orderId?: Id<"orders">;
    adminUserId?: Id<"users">;
  }
) {
  const wallet = await ensureWallet(db, args.userId, args.currency);
  if (wallet.balance < args.amount) {
    throw new Error("Insufficient wallet balance");
  }
  const now = Date.now();
  const balance = roundMoney(wallet.balance - args.amount);
  await db.patch(wallet._id, { balance, updatedAt: now });
  await db.insert("walletTransactions", {
    userId: args.userId,
    orderId: args.orderId,
    adminUserId: args.adminUserId,
    type: "debit",
    amount: args.amount,
    reason: args.reason,
    provider: "cash",
    status: "completed",
    createdAt: now,
  });
}

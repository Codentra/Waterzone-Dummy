import { mutation } from "./_generated/server";
import { v } from "convex/values";

const OTP_TTL_MS = 10 * 60 * 1000;
const DEV_CODE = "123456";

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+${trimmed.replace(/\D/g, "")}`;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Request OTP for login or signup. In dev, code is always 123456.
 */
export const requestOtp = mutation({
  args: {
    phoneE164: v.string(),
    role: v.optional(
      v.union(v.literal("customer"), v.literal("driver"), v.literal("admin"))
    ),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const phoneE164 = normalizePhone(args.phoneE164);
    if (phoneE164.length < 8) throw new Error("Invalid phone number");

    const existing = await ctx.db
      .query("otpSessions")
      .withIndex("by_phone", (q) => q.eq("phoneE164", phoneE164))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    const devMode = typeof process !== "undefined" && process.env?.OTP_DEV_MODE === "false";
    const code = devMode ? generateCode() : DEV_CODE;
    const now = Date.now();
    await ctx.db.insert("otpSessions", {
      phoneE164,
      code,
      role: args.role,
      fullName: args.fullName,
      email: args.email,
      expiresAt: now + OTP_TTL_MS,
      createdAt: now,
    });

    return { success: true, devHint: code };
  },
});

/**
 * Verify OTP and return or create user.
 */
export const verifyOtp = mutation({
  args: {
    phoneE164: v.string(),
    code: v.string(),
    role: v.optional(
      v.union(v.literal("customer"), v.literal("driver"), v.literal("admin"))
    ),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const phoneE164 = normalizePhone(args.phoneE164);
    const session = await ctx.db
      .query("otpSessions")
      .withIndex("by_phone", (q) => q.eq("phoneE164", phoneE164))
      .order("desc")
      .first();

    if (!session) throw new Error("No OTP requested for this number");
    if (Date.now() > session.expiresAt) throw new Error("OTP expired");
    if (session.code !== args.code.trim()) throw new Error("Invalid OTP");

    await ctx.db.delete(session._id);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneE164", phoneE164))
      .first();

    if (existing) {
      return {
        userId: existing._id,
        role: existing.role,
        fullName: existing.fullName,
        phoneE164: existing.phoneE164,
        isNewUser: false,
      };
    }

    const role = args.role ?? session.role ?? "customer";
    const fullName = args.fullName ?? session.fullName ?? "Waterzone User";
    const email = args.email ?? session.email;
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      fullName,
      phoneE164,
      email,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return {
      userId,
      role,
      fullName,
      phoneE164,
      isNewUser: true,
    };
  },
});

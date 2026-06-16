import { query } from "../_generated/server";

import { v } from "convex/values";



/** List wallet accounts with user info. */

export const listAccounts = query({

  args: {

    role: v.optional(

      v.union(v.literal("customer"), v.literal("driver"), v.literal("admin"))

    ),

    limit: v.optional(v.number()),

  },

  handler: async (ctx, args) => {

    const limit = args.limit ?? 100;

    const users = args.role

      ? await ctx.db

          .query("users")

          .withIndex("by_role", (q) => q.eq("role", args.role!))

          .take(limit)

      : await ctx.db.query("users").take(limit);



    const results = await Promise.all(

      users.map(async (user) => {

        const wallet = await ctx.db

          .query("walletAccounts")

          .withIndex("by_user", (q) => q.eq("userId", user._id))

          .first();

        return {

          userId: user._id,

          fullName: user.fullName,

          phoneE164: user.phoneE164,

          role: user.role,

          status: user.status,

          balance: wallet?.balance ?? 0,

          currency: wallet?.currency ?? "USD",

          walletUpdatedAt: wallet?.updatedAt ?? null,

        };

      })

    );

    return results.sort((a, b) => b.balance - a.balance);

  },

});



/** Wallet detail + recent transactions. */

export const getAccountDetail = query({

  args: {

    userId: v.id("users"),

  },

  handler: async (ctx, args) => {

    const user = await ctx.db.get(args.userId);

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db

      .query("walletAccounts")

      .withIndex("by_user", (q) => q.eq("userId", args.userId))

      .first();

    const transactions = await ctx.db

      .query("walletTransactions")

      .withIndex("by_user", (q) => q.eq("userId", args.userId))

      .take(50);

    transactions.sort((a, b) => b.createdAt - a.createdAt);

    return { user, wallet, transactions };

  },

});


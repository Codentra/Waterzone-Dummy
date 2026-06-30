import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import { requireUserRole } from "./helpers";

export async function createNotification(
  db: GenericDatabaseWriter<DataModel>,
  userId: Id<"users">,
  type: string,
  payload: Record<string, unknown>
) {
  await db.insert("notifications", {
    userId,
    type,
    payload: JSON.stringify(payload),
    status: "unread",
    createdAt: Date.now(),
  });
}

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver", "admin"]);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    return rows.map((n) => ({
      ...n,
      payloadData: JSON.parse(n.payload) as Record<string, unknown>,
    }));
  },
});

export const markRead = mutation({
  args: {
    userId: v.id("users"),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver", "admin"]);
    const n = await ctx.db.get(args.notificationId);
    if (!n || n.userId !== args.userId) throw new Error("Not found");
    await ctx.db.patch(args.notificationId, { status: "read" });
  },
});

export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserRole(ctx.db, args.userId, ["customer", "driver", "admin"]);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const n of rows) {
      if (n.status === "unread") await ctx.db.patch(n._id, { status: "read" });
    }
  },
});

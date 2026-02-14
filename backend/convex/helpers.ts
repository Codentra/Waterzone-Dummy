import type { GenericDatabaseReader } from "convex/server";
import type { Id } from "./_generated/dataModel";
import type { DataModel } from "./_generated/dataModel";

type Role = "customer" | "driver" | "admin";

/**
 * Get user and require they have one of the given roles. Throws if not found or wrong role.
 */
export async function requireUserRole(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  allowedRoles: Role[]
): Promise<{ _id: Id<"users">; role: Role }> {
  const user = await db.get(userId);
  if (!user) throw new Error("User not found");
  const role = user.role as Role;
  if (!allowedRoles.includes(role)) throw new Error("Forbidden: wrong role");
  return { _id: user._id, role };
}

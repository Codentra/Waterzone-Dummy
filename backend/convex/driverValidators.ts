import { v } from "convex/values";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

export const driverProfileValidator = v.object({
  nationalIdNumber: v.string(),
  dateOfBirth: v.string(),
  homeAddress: v.string(),
  emergencyContactName: v.string(),
  emergencyContactPhone: v.string(),
  vehicleMakeModel: v.string(),
  tankCapacityLitres: v.number(),
  vehicleColour: v.optional(v.string()),
});

export const driverDocumentsValidator = v.object({
  nationalIdFrontId: v.id("_storage"),
  nationalIdBackId: v.id("_storage"),
  driversLicenseId: v.id("_storage"),
  policeClearanceId: v.id("_storage"),
  vehicleRegistrationId: v.id("_storage"),
  proofOfAddressId: v.id("_storage"),
  profilePhotoId: v.id("_storage"),
  vehicleInsuranceId: v.optional(v.id("_storage")),
  vehicleAuthorizationId: v.optional(v.id("_storage")),
});

export const DOCUMENT_LABELS: Record<string, string> = {
  nationalIdFrontId: "National ID (front)",
  nationalIdBackId: "National ID (back)",
  driversLicenseId: "Driver's license",
  policeClearanceId: "Police clearance",
  vehicleRegistrationId: "Vehicle registration",
  proofOfAddressId: "Proof of address",
  profilePhotoId: "Profile photo",
  vehicleInsuranceId: "Vehicle insurance",
  vehicleAuthorizationId: "Vehicle authorization",
};

export type DriverProfile = {
  nationalIdNumber: string;
  dateOfBirth: string;
  homeAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  vehicleMakeModel: string;
  tankCapacityLitres: number;
  vehicleColour?: string;
};

export type DriverDocuments = {
  nationalIdFrontId: Id<"_storage">;
  nationalIdBackId: Id<"_storage">;
  driversLicenseId: Id<"_storage">;
  policeClearanceId: Id<"_storage">;
  vehicleRegistrationId: Id<"_storage">;
  proofOfAddressId: Id<"_storage">;
  profilePhotoId: Id<"_storage">;
  vehicleInsuranceId?: Id<"_storage">;
  vehicleAuthorizationId?: Id<"_storage">;
};

export function validateProfileText(profile: DriverProfile) {
  if (!profile.nationalIdNumber.trim()) throw new Error("National ID number is required");
  if (!profile.dateOfBirth.trim()) throw new Error("Date of birth is required");
  if (!profile.homeAddress.trim()) throw new Error("Home address is required");
  if (!profile.emergencyContactName.trim()) throw new Error("Emergency contact name is required");
  if (!profile.emergencyContactPhone.trim()) throw new Error("Emergency contact phone is required");
  if (!profile.vehicleMakeModel.trim()) throw new Error("Vehicle make and model is required");
  if (!Number.isFinite(profile.tankCapacityLitres) || profile.tankCapacityLitres <= 0) {
    throw new Error("Tank capacity must be greater than 0");
  }
}

export async function verifyStorageIds(
  ctx: { storage: { getMetadata: (id: Id<"_storage">) => Promise<unknown> } },
  documents: DriverDocuments
) {
  for (const [key, id] of Object.entries(documents)) {
    if (!id) continue;
    const meta = await ctx.storage.getMetadata(id as Id<"_storage">);
    if (!meta) {
      throw new Error(`Missing uploaded file for ${DOCUMENT_LABELS[key] ?? key}`);
    }
  }
}

export async function resolveDocumentUrls(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  documents: DriverDocuments | null | undefined
) {
  if (!documents) return [];
  return Promise.all(
    Object.entries(documents)
      .filter(([, id]) => Boolean(id))
      .map(async ([key, id]) => ({
        key,
        label: DOCUMENT_LABELS[key] ?? key,
        storageId: id as Id<"_storage">,
        url: await ctx.storage.getUrl(id as Id<"_storage">),
      }))
  );
}

export async function getDriverUserSummary(
  db: GenericDatabaseReader<DataModel>,
  driver: {
    _id: Id<"drivers">;
    userId: Id<"users">;
    vehiclePlate: string;
    vehicleType: string;
    verificationStatus: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    profile?: DriverProfile;
    createdAt: number;
  }
) {
  const user = await db.get(driver.userId);
  return {
    driverId: driver._id,
    userId: driver.userId,
    fullName: user?.fullName ?? "Unknown",
    phoneE164: user?.phoneE164 ?? "",
    vehiclePlate: driver.vehiclePlate,
    vehicleType: driver.vehicleType,
    verificationStatus: driver.verificationStatus,
    rejectionReason: driver.rejectionReason,
    hasCompleteProfile: Boolean(driver.profile),
    createdAt: driver.createdAt,
  };
}

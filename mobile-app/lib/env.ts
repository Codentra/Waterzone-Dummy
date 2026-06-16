/**
 * Convex URL for the Waterzone backend.
 * Set EXPO_PUBLIC_CONVEX_URL in .env (from backend deployment).
 * Uses a placeholder when unset so the app loads (Convex will not connect until you set the real URL).
 */
const envUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
export const CONVEX_URL =
  envUrl && envUrl.startsWith("http")
    ? envUrl
    : "https://placeholder.convex.cloud";

if (!envUrl && process.env.NODE_ENV !== "test") {
  console.warn(
    "EXPO_PUBLIC_CONVEX_URL is not set. Add it to .env from your Convex dashboard."
  );
}

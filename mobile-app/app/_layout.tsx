import { Stack } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from "@/lib/env";
import { AuthProvider } from "@/providers/AuthProvider";

const convex = new ConvexReactClient(CONVEX_URL);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ConvexProvider>
  );
}

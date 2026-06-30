import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { hasCompletedOnboarding } from "@/lib/onboarding-store";
import { colors } from "@/constants/theme";

export default function Index() {
  const { auth, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then(setOnboarded);
  }, []);

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.cyan600} />
      </View>
    );
  }

  if (!onboarded) {
    return <Redirect href="/(onboarding)/splash" />;
  }

  if (!auth) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  if (auth.role === "customer") {
    return <Redirect href="/(customer-tabs)/home" />;
  }

  if (auth.role === "driver") {
    return <Redirect href="/(driver-tabs)" />;
  }

  return <Redirect href="/(auth)/role-selection" />;
}

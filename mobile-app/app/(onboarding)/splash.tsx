import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Logo } from "@/components/Logo";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(onboarding)/onboarding"), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <LinearGradient
      colors={["#3b82f6", "#06b6d4", "#2dd4bf"]}
      style={styles.container}
    >
      <Logo size="lg" />
      <Text style={styles.tagline}>Pure Water Delivered</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  tagline: { color: "rgba(255,255,255,0.9)", fontSize: 14 },
});

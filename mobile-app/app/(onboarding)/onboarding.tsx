import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { setOnboardingComplete } from "@/lib/onboarding-store";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

const SLIDES = [
  {
    icon: "water" as const,
    title: "Quality Water",
    description: "Get pure, clean water delivered directly to your doorstep",
    colors: ["#3b82f6", "#06b6d4"] as const,
  },
  {
    icon: "car" as const,
    title: "Fast Delivery",
    description: "Track your water truck in real-time and get instant updates",
    colors: ["#06b6d4", "#14b8a6"] as const,
  },
  {
    icon: "shield-checkmark" as const,
    title: "Flexible Contracts",
    description: "Set up recurring deliveries for daily, weekly, or monthly supply",
    colors: ["#14b8a6", "#3b82f6"] as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  useEffect(() => {
    if (step < SLIDES.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 3000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(finish, 3000);
    return () => clearTimeout(t);
  }, [step]);

  const finish = async () => {
    await setOnboardingComplete();
    router.replace("/(auth)/role-selection");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LinearGradient colors={[...slide.colors]} style={styles.iconCircle}>
          <Ionicons name={slide.icon} size={64} color={colors.white} />
        </LinearGradient>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setStep(i)}>
            <View style={[styles.dot, i === step && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <GradientButton title="Skip" variant="outline" onPress={finish} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 12, textAlign: "center" },
  description: { fontSize: 16, color: colors.textSecondary, textAlign: "center", lineHeight: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 32, backgroundColor: colors.cyan },
  footer: { paddingBottom: 16 },
});

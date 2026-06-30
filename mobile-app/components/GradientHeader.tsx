import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadows } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  greeting?: string;
  variant?: "customer" | "driver";
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function GradientHeader({
  title,
  subtitle,
  greeting,
  variant = "customer",
  right,
  style,
}: Props) {
  const gradientColors =
    variant === "driver" ? (["#14b8a6", "#06b6d4"] as const) : (["#06b6d4", "#3b82f6"] as const);

  return (
    <LinearGradient colors={[...gradientColors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, style]}>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

export function SurfaceCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, shadows.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  textBlock: { flex: 1 },
  greeting: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
  },
  glass: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.lg,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
});

import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, radius } from "@/constants/theme";

type LogoSize = "sm" | "md" | "lg";

const sizes: Record<LogoSize, { container: number; icon: number; text: number }> = {
  sm: { container: 40, icon: 20, text: 14 },
  md: { container: 64, icon: 32, text: 20 },
  lg: { container: 96, icon: 48, text: 28 },
};

export function Logo({ size = "md" }: { size?: LogoSize }) {
  const dim = sizes[size];
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...gradients.logo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.iconCircle,
          { width: dim.container, height: dim.container, borderRadius: dim.container / 2 },
        ]}
      >
        <Ionicons name="water" size={dim.icon} color={colors.white} />
      </LinearGradient>
      <Text style={[styles.brand, { fontSize: dim.text }]}>Waterzone</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  brand: {
    fontWeight: "700",
    color: colors.cyan600,
  },
});

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { Logo } from "@/components/Logo";
import { colors, gradients, radius } from "@/constants/theme";

const DEMO_DRIVER = {
  fullName: "Demo Driver",
  phoneE164: "+263770000002",
  role: "driver" as const,
};

export default function DriverWelcomeScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const createUser = useMutation(api.users.createUser);
  const ensureDemoDriver = useMutation(api.drivers.ensureDemoDriver);
  const ensureDriverWallet = useMutation(api.payouts.ensureDriverWallet);
  const [loading, setLoading] = useState(false);
  const entered = useRef(false);

  const continueToDriver = async () => {
    if (entered.current || loading) return;
    entered.current = true;
    setLoading(true);
    try {
      const userId = await createUser({
        fullName: DEMO_DRIVER.fullName,
        phoneE164: DEMO_DRIVER.phoneE164,
        role: DEMO_DRIVER.role,
      });
      await ensureDemoDriver({ userId });
      await ensureDriverWallet({ userId });
      await signIn({
        userId: userId as unknown as string,
        role: DEMO_DRIVER.role,
        fullName: DEMO_DRIVER.fullName,
        phoneE164: DEMO_DRIVER.phoneE164,
      });
      router.replace("/(driver-tabs)");
    } catch (e) {
      entered.current = false;
      Alert.alert("Error", e instanceof Error ? e.message : "Could not continue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void continueToDriver();
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient colors={[...gradients.driver]} style={styles.container}>
      <View style={styles.content}>
        <Logo size="lg" />
        <Text style={styles.brand}>WaterZone Driver</Text>
        <Text style={styles.tagline}>Deliver pure water to customers</Text>
        <View style={styles.iconRow}>
          <View style={styles.feature}>
            <Ionicons name="car" size={22} color={colors.white} />
            <Text style={styles.featureText}>Manage deliveries</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="navigate" size={22} color={colors.white} />
            <Text style={styles.featureText}>Live navigation</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color={colors.white} size="large" />
        ) : (
          <TouchableOpacity style={styles.continueBtn} onPress={continueToDriver} activeOpacity={0.9}>
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.cyan600} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 24,
  },
  iconRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  feature: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    minWidth: 130,
  },
  featureText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radius.full,
  },
  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cyan600,
  },
});

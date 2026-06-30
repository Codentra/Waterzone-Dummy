import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { Logo } from "@/components/Logo";
import { colors, gradients, radius, shadows } from "@/constants/theme";

const DEMO_USERS = {
  customer: {
    fullName: "Demo Customer",
    phoneE164: "+263770000001",
    role: "customer" as const,
  },
  driver: {
    fullName: "Demo Driver",
    phoneE164: "+263770000002",
    role: "driver" as const,
  },
};

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const createUser = useMutation(api.users.createUser);
  const ensureDemoDriver = useMutation(api.drivers.ensureDemoDriver);
  const ensureDriverWallet = useMutation(api.payouts.ensureDriverWallet);
  const [loadingRole, setLoadingRole] = useState<"customer" | "driver" | null>(null);

  const enterAs = async (role: "customer" | "driver") => {
    const demo = DEMO_USERS[role];
    setLoadingRole(role);
    try {
      const userId = await createUser({
        fullName: demo.fullName,
        phoneE164: demo.phoneE164,
        role: demo.role,
      });
      if (role === "driver") {
        await ensureDemoDriver({ userId });
        await ensureDriverWallet({ userId });
      }
      await signIn({
        userId: userId as unknown as string,
        role: demo.role,
        fullName: demo.fullName,
        phoneE164: demo.phoneE164,
      });
      router.replace(role === "customer" ? "/(customer-tabs)/home" : "/(driver-tabs)");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not continue");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Logo size="md" />
      </View>
      <Text style={styles.heading}>Choose Your Role</Text>
      <Text style={styles.subtitle}>Select how you'd like to use Waterzone</Text>

      <TouchableOpacity
        style={[styles.roleCard, shadows.card]}
        onPress={() => enterAs("customer")}
        disabled={loadingRole !== null}
        activeOpacity={0.9}
      >
        <LinearGradient colors={[...gradients.customerIcon]} style={styles.roleIcon}>
          <Ionicons name="person" size={28} color={colors.white} />
        </LinearGradient>
        <View style={styles.roleText}>
          <Text style={styles.roleTitle}>I'm a Customer</Text>
          <Text style={styles.roleDesc}>Order water deliveries</Text>
        </View>
        {loadingRole === "customer" && <ActivityIndicator color={colors.cyan600} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleCard, shadows.card]}
        onPress={() => router.push("/(auth)/driver-welcome")}
        disabled={loadingRole !== null}
        activeOpacity={0.9}
      >
        <LinearGradient colors={[...gradients.driverIcon]} style={styles.roleIcon}>
          <Ionicons name="car" size={28} color={colors.white} />
        </LinearGradient>
        <View style={styles.roleText}>
          <Text style={styles.roleTitle}>I'm a Driver</Text>
          <Text style={styles.roleDesc}>Deliver water to customers</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  logoWrap: { marginBottom: 48 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32, textAlign: "center" },
  roleCard: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    padding: 20,
    marginBottom: 16,
  },
  roleIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: "600", color: colors.text, marginBottom: 4 },
  roleDesc: { fontSize: 14, color: colors.textSecondary },
});

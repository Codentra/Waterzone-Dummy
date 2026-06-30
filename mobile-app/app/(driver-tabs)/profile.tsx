import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { GradientButton } from "@/components/GradientButton";
import { colors, gradients, radius, shadows } from "@/constants/theme";

const MENU = [
  { icon: "person-outline" as const, label: "Edit Profile", path: "/(driver)/edit-profile" },
  { icon: "car-outline" as const, label: "Vehicle Details", path: "/(driver)/vehicle-details" },
  { icon: "cash-outline" as const, label: "Earnings", path: "/(driver)/earnings" },
  { icon: "wallet-outline" as const, label: "Withdrawal Request", path: "/(driver)/withdrawal-request" },
  { icon: "chatbubbles-outline" as const, label: "Message History", path: "/(driver)/message-history" },
  { icon: "shield-checkmark-outline" as const, label: "Privacy & Security", path: "/(driver)/privacy-security" },
  { icon: "help-circle-outline" as const, label: "Help & Support", path: "/(driver)/help-support" },
];

export default function DriverProfileScreen() {
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const driver = useQuery(
    api.drivers.getByUserId,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const initial = (auth?.fullName ?? "?").charAt(0).toUpperCase();
  const status = driver?.verificationStatus ?? "—";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <LinearGradient colors={[...gradients.driver]} style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{auth?.fullName ?? "—"}</Text>
            <View style={styles.statusRow}>
              <Ionicons name="shield-checkmark" size={14} color="#fde047" />
              <Text style={styles.statusBadge}>{status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.infoGlass}>
          <InfoRow icon="call-outline" text={auth?.phoneE164 ?? "—"} />
          {driver && (
            <InfoRow icon="car-outline" text={`${driver.vehiclePlate} · ${driver.vehicleType}`} />
          )}
        </View>
      </LinearGradient>

      <View style={[styles.menuCard, shadows.card]}>
        {MENU.map((item, i) => (
          <TouchableOpacity
            key={item.path}
            style={[styles.menuRow, i < MENU.length - 1 && styles.menuRowBorder]}
            onPress={() => router.push(item.path as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={colors.cyan600} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <GradientButton title="Sign out" variant="danger" onPress={handleSignOut} />
      <Text style={styles.version}>Waterzone Driver v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="rgba(255,255,255,0.9)" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 16, paddingBottom: 48 },
  headerCard: { borderRadius: radius.xxl, padding: 24, marginBottom: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 3, borderColor: colors.white,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: "700" },
  headerInfo: { flex: 1 },
  name: { color: colors.white, fontSize: 22, fontWeight: "700", marginBottom: 6 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusBadge: { color: colors.white, fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  infoGlass: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.lg, padding: 14, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { color: "rgba(255,255,255,0.95)", fontSize: 14 },
  menuCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 20, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cyan50, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "500", color: colors.text },
  version: { textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: 16 },
});

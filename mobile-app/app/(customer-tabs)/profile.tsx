import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { GradientButton } from "@/components/GradientButton";
import { colors, gradients, radius, shadows } from "@/constants/theme";

const MENU = [
  { icon: "person-outline" as const, label: "Edit Profile", path: "/(customer)/edit-profile" },
  { icon: "card-outline" as const, label: "Payment Methods", path: "/(customer)/payment-methods" },
  { icon: "location-outline" as const, label: "Saved Addresses", path: "/(customer)/saved-addresses" },
  { icon: "notifications-outline" as const, label: "Notifications", path: "/(customer)/notifications" },
  { icon: "time-outline" as const, label: "Delivery History", path: "/(customer)/delivery-history" },
  { icon: "chatbubbles-outline" as const, label: "Message History", path: "/(customer)/message-history" },
  { icon: "shield-checkmark-outline" as const, label: "Privacy & Security", path: "/(customer)/privacy-security" },
  { icon: "help-circle-outline" as const, label: "Help & Support", path: "/(customer)/help-support" },
  { icon: "headset-outline" as const, label: "Customer Support", path: "/(customer)/customer-support" },
];

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const initial = (auth?.fullName ?? "?").charAt(0).toUpperCase();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <LinearGradient colors={[...gradients.customer]} style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <View>
            <Text style={styles.name}>{auth?.fullName}</Text>
            <Text style={styles.role}>Customer</Text>
          </View>
        </View>
        <Text style={styles.phone}>{auth?.phoneE164}</Text>
      </LinearGradient>

      <View style={[styles.menuCard, shadows.card]}>
        {MENU.map((item, i) => (
          <TouchableOpacity
            key={item.path}
            style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]}
            onPress={() => router.push(item.path as any)}
          >
            <Ionicons name={item.icon} size={22} color={colors.cyan600} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <GradientButton title="Sign out" variant="danger" onPress={handleSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 16, paddingBottom: 48 },
  headerCard: { borderRadius: radius.xxl, padding: 24, marginBottom: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  role: { color: "rgba(255,255,255,0.85)", marginTop: 4 },
  phone: { color: "rgba(255,255,255,0.9)" },
  menuCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "500", color: colors.text },
});

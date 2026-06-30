import { View, Text, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius } from "@/constants/theme";

export default function DriverEarningsScreen() {
  const { auth } = useAuth();
  const summary = useQuery(api.drivers.getEarningsSummary, auth?.userId ? { userId: auth.userId as any } : "skip");

  return (
    <ScreenShell title="Earnings" showBack>
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.label}>Total earnings</Text>
          <Text style={styles.value}>{summary?.currency ?? "USD"} {(summary?.totalEarnings ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Completed trips</Text>
          <Text style={styles.value}>{summary?.tripCount ?? 0}</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  card: { padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  label: { color: colors.textSecondary, marginBottom: 4 },
  value: { fontSize: 24, fontWeight: "700", color: colors.cyan600 },
});

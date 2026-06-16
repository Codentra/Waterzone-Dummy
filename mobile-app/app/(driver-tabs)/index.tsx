import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  enroute: "En route",
  delivered: "Delivered",
};

export default function DriverDashboardScreen() {
  const { auth } = useAuth();
  const driver = useQuery(
    api.drivers.getByUserId,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const status = useQuery(
    api.drivers.getStatus,
    driver?._id ? { driverId: driver._id } : "skip"
  );
  const orders = useQuery(
    api.orders.listByDriver,
    driver?._id ? { driverId: driver._id } : "skip"
  );
  const updateStatus = useMutation(api.drivers.updateStatus);

  const isOnline = status?.isOnline ?? false;
  const currentOrder = orders?.find((o) => ["assigned", "accepted", "enroute"].includes(o.status));

  const onToggleOnline = async (value: boolean) => {
    if (!auth?.userId) return;
    try {
      await updateStatus({ userId: auth.userId as any, isOnline: value });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update status");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>You're {isOnline ? "online" : "offline"}</Text>
        <View style={styles.row}>
          <Text style={styles.switchLabel}>Go online to receive orders</Text>
          <Switch
            value={isOnline}
            onValueChange={onToggleOnline}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {currentOrder ? (
        <View style={[styles.card, styles.highlight]}>
          <Text style={styles.cardTitle}>Current delivery</Text>
          <Text style={styles.detail}>{currentOrder.litres} L · {currentOrder.addressText}</Text>
          <Text style={styles.status}>{STATUS_LABELS[currentOrder.status] ?? currentOrder.status}</Text>
          <Text style={styles.hint}>Use the Orders tab to Accept → En route → Delivered.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.empty}>No active delivery. Check Orders for assigned jobs.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlight: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 14, color: colors.textSecondary },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  detail: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  status: { fontSize: 14, fontWeight: "600", color: colors.primary, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.textSecondary },
  empty: { fontSize: 14, color: colors.textSecondary },
});

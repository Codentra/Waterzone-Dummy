import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  assigned: "Assigned",
  accepted: "Accepted",
  enroute: "En route",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersScreen() {
  const { auth } = useAuth();
  const orders = useQuery(
    api.orders.listByCustomer,
    auth?.userId ? { customerId: auth.userId as any } : "skip"
  );

  if (orders === undefined) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading orders…</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No orders yet. Create one from Home.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.litres} L – {STATUS_LABELS[item.status] ?? item.status}</Text>
          <Text style={styles.address} numberOfLines={2}>{item.addressText}</Text>
          <Text style={styles.meta}>Payment: {item.paymentMethod} · {item.paymentStatus}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loading: { color: colors.textSecondary },
  empty: { color: colors.textSecondary, textAlign: "center" },
  list: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  address: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.textSecondary },
});

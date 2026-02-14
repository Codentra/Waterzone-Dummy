import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
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

export default function DriverOrdersScreen() {
  const { auth } = useAuth();
  const driver = useQuery(
    api.drivers.getByUserId,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const orders = useQuery(
    api.orders.listByDriver,
    driver?._id ? { driverId: driver._id } : "skip"
  );
  const acceptOrder = useMutation(api.orders.acceptOrder);
  const setEnroute = useMutation(api.orders.setEnroute);
  const markDelivered = useMutation(api.orders.markDelivered);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const handleAccept = async (orderId: string) => {
    if (!auth?.userId) return;
    setLoadingId(orderId);
    try {
      await acceptOrder({ userId: auth.userId as any, orderId: orderId as any });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  };
  const handleEnroute = async (orderId: string) => {
    if (!auth?.userId) return;
    setLoadingId(orderId);
    try {
      await setEnroute({ userId: auth.userId as any, orderId: orderId as any });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  };
  const handleDelivered = async (orderId: string) => {
    if (!auth?.userId) return;
    setLoadingId(orderId);
    try {
      await markDelivered({ userId: auth.userId as any, orderId: orderId as any });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  };

  if (orders === undefined) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading orders…</Text>
      </View>
    );
  }

  const activeOrders = orders.filter((o) => ["assigned", "accepted", "enroute"].includes(o.status));
  const pastOrders = orders.filter((o) => o.status === "delivered");

  const renderOrder = ({ item }: { item: (typeof orders)[0] }) => {
    const loading = loadingId === item._id;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.litres} L · {STATUS_LABELS[item.status] ?? item.status}</Text>
        <Text style={styles.address} numberOfLines={2}>{item.addressText}</Text>
        {item.status === "assigned" && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => handleAccept(item._id)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Accept</Text>}
          </TouchableOpacity>
        )}
        {item.status === "accepted" && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => handleEnroute(item._id)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>En route</Text>}
          </TouchableOpacity>
        )}
        {item.status === "enroute" && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSuccess]}
            onPress={() => handleDelivered(item._id)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Mark delivered</Text>}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={[...activeOrders, ...pastOrders]}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No orders assigned yet. Go online on Dashboard.</Text>}
      renderItem={renderOrder}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loading: { color: colors.textSecondary },
  list: { padding: 16, paddingBottom: 48 },
  empty: { color: colors.textSecondary, textAlign: "center", padding: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  address: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  btn: { padding: 12, borderRadius: 8, alignItems: "center" },
  btnPrimary: { backgroundColor: colors.primary },
  btnSuccess: { backgroundColor: colors.success },
  btnText: { color: "#fff", fontWeight: "600" },
});

import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { GradientHeader } from "@/components/GradientHeader";
import { OrderContactActions } from "@/components/OrderContactActions";
import { colors, radius, shadows } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  enroute: "En route",
  delivered: "Delivered",
};

export default function DriverOrdersScreen() {
  const router = useRouter();
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

  const handleDelivered = async (orderId: string, orderTotal: number) => {
    if (!auth?.userId) return;
    Alert.alert(
      "Confirm cash received",
      `Confirm you received ${orderTotal.toFixed(2)} in cash from the customer?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Cash received",
          onPress: async () => {
            setLoadingId(orderId);
            try {
              await markDelivered({
                userId: auth.userId as any,
                orderId: orderId as any,
                cashReceived: true,
                cashReceivedAmount: orderTotal,
              });
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed");
            } finally {
              setLoadingId(null);
            }
          },
        },
      ]
    );
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
    const isActive = ["assigned", "accepted", "enroute"].includes(item.status);

    return (
      <View style={[styles.card, isActive && styles.cardActive, shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.litreBadge}>
            <Ionicons name="water" size={16} color={colors.cyan600} />
            <Text style={styles.cardTitle}>
              {item.litres.toLocaleString()} L
            </Text>
          </View>
          <Text style={styles.statusLabel}>
            {STATUS_LABELS[item.status] ?? item.status}
            {item.total != null ? ` · $${item.total.toFixed(2)}` : ""}
          </Text>
        </View>

        {item.driverEarnings != null && item.status === "delivered" && (
          <Text style={styles.earnings}>
            You keep: ${item.driverEarnings.toFixed(2)}
            {(item.fee ?? 0) > 0 && !item.commissionSettledAt
              ? ` · Commission due: $${(item.fee ?? 0).toFixed(2)}`
              : ""}
          </Text>
        )}

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={colors.cyan600} />
          <Text style={styles.address} numberOfLines={2}>
            {item.addressText}
          </Text>
        </View>

        {item.status === "assigned" && (
          <TouchableOpacity onPress={() => handleAccept(item._id)} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={["#06b6d4", "#3b82f6"]} style={styles.btn}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Accept</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
        {item.status === "accepted" && (
          <>
            <OrderContactActions
              orderId={item._id}
              status={item.status}
              phoneE164={(item as any).customer?.phoneE164}
              chatRoute="/(driver)/order-chat"
            />
            <TouchableOpacity onPress={() => handleEnroute(item._id)} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={["#06b6d4", "#3b82f6"]} style={[styles.btn, styles.btnAfterContact]}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>En route</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
        {item.status === "enroute" && (
          <>
            <OrderContactActions
              orderId={item._id}
              status={item.status}
              phoneE164={(item as any).customer?.phoneE164}
              chatRoute="/(driver)/order-chat"
            />
            <TouchableOpacity
              onPress={() => handleDelivered(item._id, item.total ?? 0)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#22c55e", "#16a34a"]} style={[styles.btn, styles.btnAfterContact]}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Mark delivered</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.proofBtn}
              onPress={() => router.push({ pathname: "/(driver)/delivery-proof", params: { orderId: item._id } })}
            >
              <Text style={styles.proofText}>Attach delivery proof</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === "delivered" && (
          <OrderContactActions
            orderId={item._id}
            status={item.status}
            phoneE164={(item as any).customer?.phoneE164}
            chatRoute="/(driver)/order-chat"
            compact
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        variant="driver"
        title="Orders"
        subtitle={`${activeOrders.length} active · ${pastOrders.length} completed`}
      />
      <FlatList
        data={[...activeOrders, ...pastOrders]}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
            <Text style={styles.empty}>No orders assigned yet. Go online on Dashboard.</Text>
          </View>
        }
        renderItem={renderOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loading: { color: colors.textSecondary },
  list: { padding: 16, paddingBottom: 48 },
  emptyWrap: { alignItems: "center", padding: 32, gap: 12 },
  empty: { color: colors.textSecondary, textAlign: "center" },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: { borderWidth: 2, borderColor: colors.cyan },
  cardHeader: { marginBottom: 10 },
  litreBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  statusLabel: { fontSize: 14, color: colors.textSecondary },
  earnings: { fontSize: 13, color: colors.cyan600, fontWeight: "600", marginBottom: 8 },
  addressRow: { flexDirection: "row", gap: 8, marginBottom: 14, alignItems: "flex-start" },
  address: { flex: 1, fontSize: 14, color: colors.textSecondary },
  btn: { padding: 14, borderRadius: radius.lg, alignItems: "center" },
  btnAfterContact: { marginTop: 10 },
  btnText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  proofBtn: { marginTop: 10, padding: 12, alignItems: "center" },
  proofText: { color: colors.cyan600, fontWeight: "600" },
});

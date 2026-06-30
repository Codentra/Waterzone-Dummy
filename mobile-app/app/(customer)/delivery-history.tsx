import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { GradientHeader } from "@/components/GradientHeader";
import { OrderContactActions } from "@/components/OrderContactActions";
import { colors, radius, shadows } from "@/constants/theme";

const STATUS: Record<string, { label: string; color: string }> = {
  requested: { label: "Requested", color: colors.textSecondary },
  assigned: { label: "Assigned", color: "#3b82f6" },
  accepted: { label: "Accepted", color: "#3b82f6" },
  enroute: { label: "En route", color: colors.cyan600 },
  delivered: { label: "Delivered", color: colors.green600 },
  cancelled: { label: "Cancelled", color: colors.errorText },
};

const ACTIVE = new Set(["requested", "assigned", "accepted", "enroute"]);

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type OrderRow = {
  _id: string;
  status: string;
  litres: number;
  addressText: string;
  total?: number;
  paymentMethod: string;
  requestedAt: number;
  deliveredAt?: number;
  driver?: { fullName: string; phoneE164: string; vehiclePlate: string } | null;
};

function OrderCard({
  item,
  onTrack,
  onRate,
}: {
  item: OrderRow;
  onTrack: () => void;
  onRate?: () => void;
}) {
  const status = STATUS[item.status] ?? { label: item.status, color: colors.textMuted };
  const date = item.deliveredAt ?? item.requestedAt;

  return (
    <TouchableOpacity style={[styles.card, shadows.card]} onPress={onTrack} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={styles.litreRow}>
          <Ionicons name="water" size={18} color={colors.cyan600} />
          <Text style={styles.litres}>{item.litres.toLocaleString()} L</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${status.color}18` }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatDate(date)}</Text>
      <View style={styles.addrRow}>
        <Ionicons name="location-outline" size={14} color={colors.textMuted} />
        <Text style={styles.addr} numberOfLines={2}>{item.addressText}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.total}>USD {(item.total ?? 0).toFixed(2)}</Text>
        <Text style={styles.payment}>{item.paymentMethod === "cash" ? "Cash on delivery" : item.paymentMethod}</Text>
      </View>
      {["accepted", "enroute", "delivered"].includes(item.status) && item.driver && (
        <OrderContactActions
          orderId={item._id}
          status={item.status}
          phoneE164={item.driver.phoneE164}
          chatRoute="/(customer)/order-chat"
          compact
        />
      )}
      {item.status === "delivered" && onRate && (
        <TouchableOpacity style={styles.rateBtn} onPress={onRate}>
          <Text style={styles.rateText}>Rate driver</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function DeliveryHistoryScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const orders = useQuery(
    api.orders.listByCustomer,
    auth?.userId ? { customerId: auth.userId as any } : "skip"
  );

  if (orders === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.cyan600} />
      </View>
    );
  }

  const active = orders.filter((o) => ACTIVE.has(o.status));
  const past = orders.filter((o) => !ACTIVE.has(o.status));

  const openTrack = (orderId: string) =>
    router.push({ pathname: "/(customer)/tracking", params: { orderId } });

  const openRate = (orderId: string) =>
    router.push({ pathname: "/(customer)/rate-driver", params: { orderId } });

  return (
    <View style={styles.container}>
      <GradientHeader title="Delivery history" subtitle={`${orders.length} total`} />
      {orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="water-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No deliveries yet</Text>
          <Text style={styles.emptySub}>Your water orders will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {active.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active</Text>
              {active.map((item) => (
                <OrderCard key={item._id} item={item} onTrack={() => openTrack(item._id)} />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, active.length > 0 && { marginTop: 8 }]}>
                Past deliveries
              </Text>
              {past.map((item) => (
                <OrderCard
                  key={item._id}
                  item={item}
                  onTrack={() => openTrack(item._id)}
                  onRate={item.status === "delivered" ? () => openRate(item._id) : undefined}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  litreRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  litres: { fontSize: 17, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  addrRow: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginBottom: 10 },
  addr: { flex: 1, fontSize: 14, color: colors.textSecondary },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontWeight: "700", fontSize: 16, color: colors.cyan600 },
  payment: { fontSize: 12, color: colors.textMuted, textTransform: "capitalize" },
  rateBtn: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center" },
  rateText: { color: colors.cyan600, fontWeight: "600" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  emptySub: { color: colors.textSecondary, textAlign: "center" },
});

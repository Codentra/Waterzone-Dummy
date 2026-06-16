import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function DriverWalletScreen() {
  const { auth } = useAuth();
  const summary = useQuery(
    api.commissions.getDriverSummary,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const settlements = useQuery(
    api.commissions.listMySettlements,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const submitPayment = useMutation(api.commissions.submitPayment);
  const [loading, setLoading] = useState(false);

  if (summary === undefined) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const unsettledIds = summary?.unsettledOrders.map((o) => o.orderId) ?? [];

  const handleSubmitCommission = () => {
    if (!auth?.userId || unsettledIds.length === 0) return;
    Alert.alert(
      "Pay platform commission",
      `Submit ${summary.currency} ${summary.outstanding.toFixed(2)} for ${unsettledIds.length} delivery(s)? Admin will confirm once received.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit payment",
          onPress: async () => {
            setLoading(true);
            try {
              await submitPayment({
                userId: auth.userId as any,
                orderIds: unsettledIds as any,
              });
              Alert.alert("Submitted", "Commission payment sent for admin confirmation.");
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={[styles.balanceCard, summary.overdueAmount > 0 && styles.overdueCard]}>
        <Text style={styles.balanceLabel}>Commission owed to platform</Text>
        <Text style={styles.balanceValue}>
          {summary.currency} {summary.outstanding.toFixed(2)}
        </Text>
        <Text style={styles.hint}>
          {summary.commissionPercent}% of each delivery · Due within {summary.settlementCycleDays} days
        </Text>
        {summary.overdueAmount > 0 && (
          <Text style={styles.overdueText}>
            Overdue: {summary.currency} {summary.overdueAmount.toFixed(2)}
          </Text>
        )}
      </View>

      {summary.pendingReview > 0 && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>
            {summary.currency} {summary.pendingReview.toFixed(2)} awaiting admin confirmation
          </Text>
        </View>
      )}

      {summary.outstanding > 0 && (
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handleSubmitCommission}
          disabled={loading || summary.pendingReview > 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>
              {summary.pendingReview > 0 ? "Payment pending review" : "Submit commission payment"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Unsettled deliveries</Text>
      {summary.unsettledOrders.length === 0 ? (
        <Text style={styles.empty}>No commission due.</Text>
      ) : (
        summary.unsettledOrders.map((order) => (
          <View key={order.orderId} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>
                {order.litres.toLocaleString()}L · {summary.currency} {order.total.toFixed(2)} collected
              </Text>
              <Text style={styles.rowMeta}>
                Commission: {summary.currency} {order.commission.toFixed(2)}
                {order.commissionDueAt
                  ? ` · Due ${new Date(order.commissionDueAt).toLocaleDateString()}`
                  : ""}
                {order.isOverdue ? " · OVERDUE" : ""}
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment history</Text>
      {(settlements ?? []).length === 0 ? (
        <Text style={styles.empty}>No commission payments yet.</Text>
      ) : (
        (settlements ?? []).map((s) => (
          <View key={s._id} style={styles.row}>
            <Text style={styles.rowTitle}>
              {s.currency} {s.amount.toFixed(2)} · {s.status}
            </Text>
            <Text style={styles.rowMeta}>{new Date(s.submittedAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loading: { color: colors.textSecondary },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  overdueCard: { backgroundColor: "#dc2626" },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  balanceValue: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 8 },
  overdueText: { color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 8 },
  pendingCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pendingText: { color: "#92400e", fontSize: 14 },
  payBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: "#fff", fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  empty: { color: colors.textSecondary },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { fontSize: 14, fontWeight: "500" },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});

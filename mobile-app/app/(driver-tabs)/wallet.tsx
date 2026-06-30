import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { GradientHeader } from "@/components/GradientHeader";
import { colors, gradients, radius, shadows } from "@/constants/theme";

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
      <GradientHeader variant="driver" title="Commission" />

      <View style={styles.content}>
        <LinearGradient
          colors={summary.overdueAmount > 0 ? ["#dc2626", "#ef4444"] : [...gradients.driver]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.balanceCard, shadows.button]}
        >
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
        </LinearGradient>

        {summary.pendingReview > 0 && (
          <View style={styles.pendingCard}>
            <Ionicons name="time-outline" size={18} color={colors.warningText} />
            <Text style={styles.pendingText}>
              {summary.currency} {summary.pendingReview.toFixed(2)} awaiting admin confirmation
            </Text>
          </View>
        )}

        {summary.outstanding > 0 && (
          <TouchableOpacity
            onPress={handleSubmitCommission}
            disabled={loading || summary.pendingReview > 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                summary.pendingReview > 0
                  ? [colors.border, colors.border]
                  : ["#14b8a6", "#06b6d4"]
              }
              style={[styles.payBtn, (loading || summary.pendingReview > 0) && styles.payBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payBtnText}>
                  {summary.pendingReview > 0 ? "Payment pending review" : "Submit commission payment"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Unsettled deliveries</Text>
        {summary.unsettledOrders.length === 0 ? (
          <Text style={styles.empty}>No commission due.</Text>
        ) : (
          summary.unsettledOrders.map((order) => (
            <View key={order.orderId} style={[styles.row, shadows.card]}>
              <View style={styles.rowIcon}>
                <Ionicons name="water" size={20} color={colors.cyan600} />
              </View>
              <View style={styles.rowBody}>
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
            <View key={s._id} style={[styles.row, shadows.card]}>
              <View style={styles.rowIcon}>
                <Ionicons name="receipt-outline" size={20} color={colors.teal} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>
                  {s.currency} {s.amount.toFixed(2)} · {s.status}
                </Text>
                <Text style={styles.rowMeta}>{new Date(s.submittedAt).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: 48 },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loading: { color: colors.textSecondary },
  balanceCard: { borderRadius: radius.xxl, padding: 24, marginBottom: 16 },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 4 },
  balanceValue: { color: colors.white, fontSize: 32, fontWeight: "700" },
  hint: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 8 },
  overdueText: { color: colors.white, fontSize: 13, fontWeight: "600", marginTop: 8 },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
  },
  pendingText: { flex: 1, color: colors.warningText, fontSize: 14 },
  payBtn: {
    padding: 16,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: 24,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  empty: { color: colors.textSecondary, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cyan50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});

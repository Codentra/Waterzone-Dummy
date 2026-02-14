import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function WalletScreen() {
  const { auth } = useAuth();
  const wallet = useQuery(
    api.wallets.getWallet,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const transactions = useQuery(
    api.wallets.listTransactions,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );

  if (wallet === undefined) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading wallet…</Text>
      </View>
    );
  }

  const balance = wallet?.balance ?? 0;
  const list = transactions ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>{wallet?.currency ?? "USD"} {balance.toFixed(2)}</Text>
        <Text style={styles.hint}>Paynow / payouts stubbed – no real money flow yet.</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {list.length === 0 ? (
        <Text style={styles.empty}>No transactions yet.</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowType}>{item.type} · {item.reason}</Text>
              <Text style={styles.rowAmount}>{item.type === "credit" ? "+" : "-"}{item.amount} {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loading: { color: colors.textSecondary },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  balanceValue: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  empty: { color: colors.textSecondary },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowType: { fontSize: 14 },
  rowAmount: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
});

import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius } from "@/constants/theme";

export default function TransactionHistoryScreen() {
  const { auth } = useAuth();
  const transactions = useQuery(api.wallets.listTransactions, auth?.userId ? { userId: auth.userId as any } : "skip");

  return (
    <ScreenShell title="Transaction history" showBack>
      <FlatList
        data={transactions ?? []}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No transactions.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.type}>{item.type}</Text>
            <Text>{item.reason}</Text>
            <Text style={styles.amount}>{item.type === "credit" ? "+" : "-"}{item.amount}</Text>
          </View>
        )}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 32 },
  row: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 8, gap: 4 },
  type: { fontWeight: "600", textTransform: "capitalize" },
  amount: { fontWeight: "700" },
});

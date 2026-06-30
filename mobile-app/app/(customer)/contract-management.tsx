import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius } from "@/constants/theme";

export default function ContractManagementScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const contracts = useQuery(api.contracts.listByCustomer, auth?.userId ? { customerId: auth.userId as any } : "skip");
  const pause = useMutation(api.contracts.pause);
  const cancel = useMutation(api.contracts.cancel);

  return (
    <ScreenShell title="My contracts" showBack>
      <View style={styles.body}>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push("/(customer-tabs)/contract")}>
          <Text style={styles.newText}>+ New contract</Text>
        </TouchableOpacity>
        <FlatList
          data={contracts ?? []}
          keyExtractor={(i) => i._id}
          ListEmptyComponent={<Text style={styles.empty}>No contracts yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.frequency} · {item.litres}L</Text>
              <Text>{item.addressText}</Text>
              <Text>Status: {item.status}</Text>
              {item.status === "active" && (
                <TouchableOpacity onPress={() => auth?.userId && pause({ contractId: item._id, customerId: auth.userId as any })}>
                  <Text style={styles.action}>Pause</Text>
                </TouchableOpacity>
              )}
              {item.status !== "cancelled" && (
                <TouchableOpacity onPress={() => auth?.userId && cancel({ contractId: item._id, customerId: auth.userId as any })}>
                  <Text style={[styles.action, styles.danger]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 16 },
  newBtn: { padding: 14, backgroundColor: colors.cyan50, borderRadius: radius.lg, marginBottom: 12 },
  newText: { color: colors.cyan600, fontWeight: "600", textAlign: "center" },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 24 },
  card: { padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 10, gap: 4 },
  title: { fontWeight: "700" },
  action: { color: colors.cyan600, marginTop: 8 },
  danger: { color: colors.errorText },
});

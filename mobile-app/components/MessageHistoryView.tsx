import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius, shadows } from "@/constants/theme";

type Props = {
  chatRoute: "/(customer)/order-chat" | "/(driver)/order-chat";
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MessageHistoryView({ chatRoute }: Props) {
  const router = useRouter();
  const { auth } = useAuth();
  const threads = useQuery(
    api.orderChat.listThreads,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );

  return (
    <ScreenShell title="Message history" showBack>
      {!threads ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.cyan600} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                Chat with your driver or customer after an order is accepted.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, shadows.card]}
              onPress={() =>
                router.push({ pathname: chatRoute, params: { orderId: item.orderId } })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.otherParty?.fullName ?? "Contact"}</Text>
                <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
              </View>
              <Text style={styles.orderMeta}>
                {item.litres.toLocaleString()} L · {item.status}
              </Text>
              <Text style={styles.preview} numberOfLines={2}>
                {item.lastMessage?.body ?? "No messages yet — tap to open chat"}
              </Text>
              {item.messageCount > 0 && (
                <Text style={styles.count}>{item.messageCount} message{item.messageCount === 1 ? "" : "s"}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 48 },
  emptyWrap: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  emptySub: { color: colors.textSecondary, textAlign: "center" },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  date: { fontSize: 12, color: colors.textMuted },
  orderMeta: { fontSize: 13, color: colors.cyan600, marginBottom: 6 },
  preview: { fontSize: 14, color: colors.textSecondary },
  count: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});

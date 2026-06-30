import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius } from "@/constants/theme";

export default function NotificationsScreen() {
  const { auth } = useAuth();
  const list = useQuery(api.notifications.listByUser, auth?.userId ? { userId: auth.userId as any } : "skip");
  const markRead = useMutation(api.notifications.markRead);

  return (
    <ScreenShell title="Notifications" showBack>
      <FlatList
        data={list ?? []}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications.</Text>}
        renderItem={({ item }) => {
          const title = item.type.replace(/_/g, " ");
          const body = JSON.stringify(item.payloadData);
          return (
            <TouchableOpacity
              style={[styles.card, item.status === "unread" && styles.unread]}
              onPress={() => auth?.userId && markRead({ notificationId: item._id, userId: auth.userId as any })}
            >
              <Text style={styles.title}>{title}</Text>
              <Text numberOfLines={2}>{body}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 32 },
  card: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 8, backgroundColor: colors.white },
  unread: { backgroundColor: colors.cyan50 },
  title: { fontWeight: "600", marginBottom: 4, textTransform: "capitalize" },
});

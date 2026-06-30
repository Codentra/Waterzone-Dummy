import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius } from "@/constants/theme";

type Props = {
  orderId: string;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderChatView({ orderId }: Props) {
  const { auth } = useAuth();
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const thread = useQuery(
    api.orderChat.listMessages,
    auth?.userId && orderId
      ? { userId: auth.userId as any, orderId: orderId as any }
      : "skip"
  );
  const sendMessage = useMutation(api.orderChat.sendMessage);

  useEffect(() => {
    if (thread?.messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [thread?.messages.length]);

  const handleSend = async () => {
    if (!auth?.userId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        userId: auth.userId as any,
        orderId: orderId as any,
        body: draft.trim(),
      });
      setDraft("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    const phone = thread?.otherParty?.phoneE164;
    if (!phone) {
      Alert.alert("No phone number", "Contact phone is not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const title = thread?.otherParty?.fullName ?? "Order chat";
  const subtitle = thread?.order
    ? `${thread.order.litres.toLocaleString()} L · ${thread.order.status}`
    : undefined;

  return (
    <ScreenShell title={title} showBack>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {subtitle && (
          <View style={styles.subHeader}>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {thread?.otherParty?.phoneE164 && (
              <TouchableOpacity style={styles.callIcon} onPress={handleCall}>
                <Ionicons name="call" size={20} color={colors.cyan600} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {!thread ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.cyan600} />
          </View>
        ) : (
          <>
            <FlatList
              ref={listRef}
              data={thread.messages}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.messageList}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    No messages yet. Say hello to coordinate delivery.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const mine = item.senderUserId === auth?.userId;
                return (
                  <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                      <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(item.createdAt)}</Text>
                    </View>
                  </View>
                );
              }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            />

            {!thread.canSend && (
              <Text style={styles.readOnly}>This delivery is complete. Chat history is saved for reference.</Text>
            )}

            {thread.canSend && (
              <View style={styles.composer}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Type a message…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}
                  onPress={handleSend}
                  disabled={!draft.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  subtitle: { flex: 1, fontSize: 13, color: colors.textSecondary },
  callIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cyan50,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyWrap: { alignItems: "center", padding: 32, gap: 12 },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  bubbleRow: { marginBottom: 10, alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "82%",
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleMine: { backgroundColor: colors.cyan600, borderColor: colors.cyan600 },
  bubbleTheirs: {},
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.white },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  timeMine: { color: "rgba(255,255,255,0.8)" },
  readOnly: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.cyan50,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cyan600,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
});

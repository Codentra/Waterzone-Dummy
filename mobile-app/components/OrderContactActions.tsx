import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius } from "@/constants/theme";

const CHAT_STATUSES = new Set(["accepted", "enroute", "delivered"]);

type Props = {
  orderId: string;
  status: string;
  phoneE164?: string;
  chatRoute: "/(customer)/order-chat" | "/(driver)/order-chat";
  compact?: boolean;
};

export function OrderContactActions({ orderId, status, phoneE164, chatRoute, compact }: Props) {
  const router = useRouter();
  const canChat = CHAT_STATUSES.has(status);

  if (!canChat) return null;

  const handleCall = () => {
    if (!phoneE164) {
      Alert.alert("No phone number", "Contact phone is not available for this order.");
      return;
    }
    Linking.openURL(`tel:${phoneE164}`);
  };

  const openChat = () =>
    router.push({ pathname: chatRoute, params: { orderId } });

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <TouchableOpacity style={styles.compactBtn} onPress={openChat}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.cyan600} />
          <Text style={styles.compactText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.compactBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={18} color={colors.cyan600} />
          <Text style={styles.compactText}>Call</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.white} />
        <Text style={styles.chatText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
        <Ionicons name="call-outline" size={20} color={colors.cyan600} />
        <Text style={styles.callText}>Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cyan600,
  },
  chatText: { color: colors.white, fontWeight: "600" },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cyan600,
    backgroundColor: colors.white,
  },
  callText: { color: colors.cyan600, fontWeight: "600" },
  compactRow: { flexDirection: "row", gap: 16, marginTop: 10 },
  compactBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  compactText: { color: colors.cyan600, fontWeight: "600", fontSize: 14 },
});

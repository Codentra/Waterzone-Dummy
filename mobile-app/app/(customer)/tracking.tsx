import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { OrderContactActions } from "@/components/OrderContactActions";
import { colors, radius } from "@/constants/theme";

const STATUS: Record<string, string> = {
  requested: "Requested",
  assigned: "Driver assigned",
  accepted: "Accepted",
  enroute: "En route",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const order = useQuery(api.orders.get, orderId ? { orderId: orderId as any } : "skip");
  const contact = useQuery(
    api.orderChat.getContactSummary,
    auth?.userId && orderId
      ? { userId: auth.userId as any, orderId: orderId as any }
      : "skip"
  );

  return (
    <ScreenShell title="Track order" showBack>
      <View style={styles.body}>
        {!order ? (
          <Text>Loading…</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.status}>{STATUS[order.status] ?? order.status}</Text>
              <Text>{order.litres.toLocaleString()} L</Text>
              <Text style={styles.addr}>{order.addressText}</Text>
              <Text>Payment: {order.paymentMethod} · {order.paymentStatus}</Text>
              {contact?.canChat && (
                <OrderContactActions
                  orderId={orderId!}
                  status={order.status}
                  phoneE164={contact.otherParty?.phoneE164}
                  chatRoute="/(customer)/order-chat"
                />
              )}
            </View>
            {order.status === "delivered" && (
              <GradientButton
                title="Rate driver"
                onPress={() => router.push({ pathname: "/(customer)/rate-driver", params: { orderId } })}
              />
            )}
          </>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  card: { padding: 20, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 8 },
  status: { fontSize: 20, fontWeight: "700", color: colors.cyan600 },
  addr: { color: colors.textSecondary },
});

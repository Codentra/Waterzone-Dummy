import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { colors } from "@/constants/theme";

export default function PaymentProcessingScreen() {
  const { orderId, amount } = useLocalSearchParams<{ orderId: string; amount: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const createIntent = useMutation(api.payments.createIntent);
  const markPaid = useMutation(api.payments.markIntentPaid);
  const [status, setStatus] = useState("creating");

  useEffect(() => {
    const run = async () => {
      if (!auth?.userId || !orderId) return;
      try {
        const intentId = await createIntent({
          customerId: auth.userId as any,
          orderId: orderId as any,
          amount: Number(amount) || 0,
          provider: "wallet",
          currency: "USD",
        });
        await markPaid({ customerId: auth.userId as any, intentId });
        setStatus("paid");
        router.replace({ pathname: "/(customer)/order-confirmation", params: { orderId } });
      } catch {
        setStatus("failed");
      }
    };
    void run();
  }, [auth?.userId, orderId, amount, createIntent, markPaid, router]);

  return (
    <ScreenShell title="Processing payment" showBack>
      <View style={styles.body}>
        <ActivityIndicator size="large" color={colors.cyan600} />
        <Text style={styles.text}>{status === "failed" ? "Payment failed" : "Processing…"}</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  text: { color: colors.textSecondary },
});

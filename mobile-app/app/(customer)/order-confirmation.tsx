import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const order = useQuery(api.orders.get, orderId ? { orderId: orderId as any } : "skip");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order placed!</Text>
      <Text style={styles.subtitle}>Pay in cash on delivery</Text>
      {order && (
        <View style={styles.card}>
          <Text>{order.litres.toLocaleString()} L</Text>
          <Text>{order.addressText}</Text>
          <Text style={styles.total}>Total: USD {(order.total ?? 0).toFixed(2)}</Text>
        </View>
      )}
      <GradientButton title="Track order" onPress={() => router.replace({ pathname: "/(customer)/tracking", params: { orderId } })} />
      <GradientButton title="Back to home" variant="outline" onPress={() => router.replace("/(customer-tabs)/home")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: colors.background, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", color: colors.cyan600 },
  subtitle: { textAlign: "center", color: colors.textSecondary },
  card: { padding: 20, borderRadius: radius.lg, backgroundColor: colors.cyan50, gap: 8 },
  total: { fontWeight: "700", fontSize: 18 },
});

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function QuickReorderScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const quickReorder = useMutation(api.orders.quickReorder);
  const [loading, setLoading] = useState(false);

  const reorder = async () => {
    if (!auth?.userId) return;
    setLoading(true);
    try {
      const orderId = await quickReorder({ customerId: auth.userId as any });
      router.replace({ pathname: "/(customer)/order-confirmation", params: { orderId } });
    } catch (e: any) {
      alert(e.message ?? "No previous order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Quick reorder" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>Repeat your last delivery with one tap.</Text>
        <GradientButton title="Reorder last order" onPress={reorder} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary },
});

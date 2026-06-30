import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenShell } from "@/components/ScreenShell";
import { colors, radius } from "@/constants/theme";

export default function PaymentSelectionScreen() {
  const { amount } = useLocalSearchParams<{ orderId: string; amount: string }>();
  const router = useRouter();

  return (
    <ScreenShell title="Payment" showBack>
      <View style={styles.body}>
        <TouchableOpacity style={styles.card} onPress={() => router.replace("/(customer-tabs)/home")}>
          <Text style={styles.title}>Cash on delivery</Text>
          <Text>Pay USD {amount ?? "—"} to the driver when your water arrives.</Text>
        </TouchableOpacity>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  card: { padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  title: { fontWeight: "700", marginBottom: 4 },
});

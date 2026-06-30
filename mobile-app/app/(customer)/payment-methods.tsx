import { View, Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { colors } from "@/constants/theme";

export default function PaymentMethodsScreen() {
  return (
    <ScreenShell title="Payment methods" showBack>
      <View style={styles.body}>
        <Text style={styles.item}>Cash on delivery (default)</Text>
        <Text style={styles.hint}>Card payments can be enabled via payment selection when placing an order.</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  item: { padding: 16, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontWeight: "600" },
  hint: { color: colors.textSecondary, fontSize: 13 },
});

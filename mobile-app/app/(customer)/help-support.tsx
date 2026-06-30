import { View, Text, StyleSheet, Linking } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function HelpSupportScreen() {
  return (
    <ScreenShell title="Help & support" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>Need help with an order or your account? Contact Waterzone support.</Text>
        <GradientButton title="Email support" onPress={() => Linking.openURL("mailto:support@waterzone.app")} />
        <Text style={styles.faq}>FAQ: Orders are paid cash on delivery.</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary, lineHeight: 22 },
  faq: { fontSize: 13, color: colors.textMuted },
});

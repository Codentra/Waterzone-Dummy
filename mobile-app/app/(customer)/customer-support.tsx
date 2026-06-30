import { View, Text, StyleSheet, Linking } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function CustomerSupportScreen() {
  return (
    <ScreenShell title="Customer support" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>Chat with our team about orders, contracts, or account issues.</Text>
        <GradientButton title="Call support" onPress={() => Linking.openURL("tel:+1234567890")} />
        <GradientButton title="Email support" variant="outline" onPress={() => Linking.openURL("mailto:support@waterzone.app")} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary, lineHeight: 22 },
});

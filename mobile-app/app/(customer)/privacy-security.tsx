import { View, Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { colors } from "@/constants/theme";

export default function PrivacySecurityScreen() {
  return (
    <ScreenShell title="Privacy & security" showBack>
      <View style={styles.body}>
        <Text style={styles.h}>Data we collect</Text>
        <Text style={styles.p}>Phone number, delivery addresses, and order history to provide water delivery services.</Text>
        <Text style={styles.h}>Security</Text>
        <Text style={styles.p}>Sessions are stored securely on your device. OTP verification protects your account.</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 8 },
  h: { fontWeight: "700", fontSize: 16, marginTop: 12 },
  p: { color: colors.textSecondary, lineHeight: 22 },
});

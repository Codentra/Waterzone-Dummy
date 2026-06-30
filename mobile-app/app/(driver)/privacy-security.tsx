import { View, Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { colors } from "@/constants/theme";

export default function DriverPrivacySecurityScreen() {
  return (
    <ScreenShell title="Privacy & security" showBack>
      <View style={styles.body}>
        <Text style={styles.h}>Driver data</Text>
        <Text style={styles.p}>We store your vehicle details, documents, and delivery history to operate the platform safely.</Text>
        <Text style={styles.h}>Location</Text>
        <Text style={styles.p}>When online, your location is shared with customers to show nearby trucks.</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 8 },
  h: { fontWeight: "700", fontSize: 16, marginTop: 12 },
  p: { color: colors.textSecondary, lineHeight: 22 },
});

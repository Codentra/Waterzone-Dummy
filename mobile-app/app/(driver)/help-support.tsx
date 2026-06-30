import { View, Text, StyleSheet, Linking } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function DriverHelpSupportScreen() {
  return (
    <ScreenShell title="Help & support" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>Driver support for payouts, verification, and delivery issues.</Text>
        <GradientButton title="Email driver support" onPress={() => Linking.openURL("mailto:drivers@waterzone.app")} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary, lineHeight: 22 },
});

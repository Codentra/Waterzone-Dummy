import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function IdVerificationScreen() {
  const router = useRouter();

  return (
    <ScreenShell title="ID verification" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>
          Drivers must upload national ID, license, and vehicle documents during registration. Customers may verify identity for high-value contracts.
        </Text>
        <GradientButton title="Continue driver registration" onPress={() => router.push("/(auth)/driver-registration")} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary, lineHeight: 22 },
});

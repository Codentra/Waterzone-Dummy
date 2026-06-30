import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function OfflineErrorScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're offline</Text>
      <Text style={styles.sub}>Check your connection and try again.</Text>
      <GradientButton title="Retry" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.background, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  sub: { textAlign: "center", color: colors.textSecondary, marginBottom: 16 },
});

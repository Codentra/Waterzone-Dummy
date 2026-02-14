import { View, Text, StyleSheet } from "react-native";

/**
 * Shown when driver has registered but verification is still pending.
 */
export default function RegisterPendingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Pending</Text>
      <Text style={styles.subtitle}>
        Your driver application is under review. You’ll be notified when approved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
});

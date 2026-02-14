import { View, Text, StyleSheet } from "react-native";

export default function ProfileSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Setup</Text>
      <Text style={styles.subtitle}>Name, phone, etc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666" },
});

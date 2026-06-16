import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function DriverProfileScreen() {
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const driver = useQuery(
    api.drivers.getByUserId,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{auth?.fullName ?? "—"}</Text>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{auth?.phoneE164 ?? "—"}</Text>
        <Text style={styles.label}>Driver status</Text>
        <Text style={styles.value}>{driver?.verificationStatus ?? "—"}</Text>
        {driver && (
          <>
            <Text style={styles.label}>Vehicle</Text>
            <Text style={styles.value}>{driver.vehiclePlate} · {driver.vehicleType}</Text>
          </>
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: 12, marginBottom: 4 },
  value: { fontSize: 16 },
  button: {
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

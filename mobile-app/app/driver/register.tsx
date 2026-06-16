import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function DriverRegisterScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const registerDriver = useMutation(api.drivers.registerDriver);

  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [docsMetadata, setDocsMetadata] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const plate = vehiclePlate.trim();
    const type = vehicleType.trim();
    if (!plate || !type) {
      Alert.alert("Missing fields", "Enter vehicle plate and type.");
      return;
    }
    if (!auth?.userId) {
      Alert.alert("Error", "Not signed in.");
      return;
    }
    setLoading(true);
    try {
      await registerDriver({
        userId: auth.userId as any,
        vehiclePlate: plate,
        vehicleType: type,
        docsMetadata: docsMetadata.trim() || "{}",
      });
      router.replace("/driver/register-pending");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register as driver</Text>
      <Text style={styles.subtitle}>Vehicle and docs (placeholder)</Text>

      <TextInput
        style={styles.input}
        placeholder="Vehicle plate"
        value={vehiclePlate}
        onChangeText={setVehiclePlate}
      />
      <TextInput
        style={styles.input}
        placeholder="Vehicle type (e.g. truck, van)"
        value={vehicleType}
        onChangeText={setVehicleType}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Docs metadata (optional JSON)"
        value={docsMetadata}
        onChangeText={setDocsMetadata}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 80 },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

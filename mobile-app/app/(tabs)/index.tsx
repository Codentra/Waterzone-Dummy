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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

const PAYMENT_METHODS = ["ecocash", "onemoney", "innbucks", "cash", "card"] as const;

export default function HomeScreen() {
  const { auth } = useAuth();
  const createOrder = useMutation(api.orders.createOrder);
  const assignDriver = useMutation(api.orders.assignDriver);

  const [litres, setLitres] = useState("");
  const [addressText, setAddressText] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("ecocash");
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    const numLitres = parseFloat(litres);
    const address = addressText.trim();
    if (!address || isNaN(numLitres) || numLitres <= 0) {
      Alert.alert("Invalid input", "Enter litres and delivery address.");
      return;
    }
    if (!auth?.userId) {
      Alert.alert("Error", "Not signed in.");
      return;
    }
    setLoading(true);
    try {
      const orderId = await createOrder({
        customerId: auth.userId as any,
        litres: numLitres,
        addressText: address,
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      await assignDriver({ orderId, callerUserId: auth.userId as any });
      Alert.alert("Order placed", "A driver will be assigned. Check Orders for status.");
      setLitres("");
      setAddressText("");
      setNotes("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create water order</Text>
        <Text style={styles.subtitle}>Litres, address, payment (no real Paynow yet)</Text>

        <TextInput
          style={styles.input}
          placeholder="Litres (e.g. 20)"
          value={litres}
          onChangeText={setLitres}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Delivery address"
          value={addressText}
          onChangeText={setAddressText}
          multiline
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Text style={styles.label}>Payment method</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, paymentMethod === m && styles.chipActive]}
              onPress={() => setPaymentMethod(m)}
            >
              <Text style={[styles.chipText, paymentMethod === m && styles.chipTextActive]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Place order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 80 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  paymentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
  chipText: { fontSize: 14, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: "600" },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

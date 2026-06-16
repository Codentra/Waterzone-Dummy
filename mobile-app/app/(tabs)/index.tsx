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
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function HomeScreen() {
  const { auth } = useAuth();
  const createOrder = useMutation(api.orders.createOrder);
  const assignDriver = useMutation(api.orders.assignDriver);

  const bundles = useQuery(api.pricing.listBundles, {});
  const [selectedLitres, setSelectedLitres] = useState<number | null>(null);
  const [addressText, setAddressText] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const pricing = useQuery(
    api.pricing.preview,
    selectedLitres ? { litres: selectedLitres } : "skip"
  );

  const handleCreateOrder = async () => {
    const address = addressText.trim();
    if (!address || !selectedLitres) {
      Alert.alert("Invalid input", "Select a bundle and enter delivery address.");
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
        litres: selectedLitres,
        addressText: address,
        notes: notes.trim() || undefined,
        paymentMethod: "cash",
      });
      await assignDriver({ orderId, callerUserId: auth.userId as any });
      Alert.alert(
        "Order placed",
        `Pay ${pricing?.currency ?? "USD"} ${pricing?.total.toFixed(2) ?? "—"} in cash on delivery.`
      );
      setSelectedLitres(null);
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
        <Text style={styles.subtitle}>Choose a bundle · Cash on delivery</Text>

        <Text style={styles.sectionLabel}>Select bundle</Text>
        {bundles === undefined ? (
          <ActivityIndicator style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.bundleGrid}>
            {bundles.bundles.map((bundle) => {
              const selected = selectedLitres === bundle.litres;
              return (
                <TouchableOpacity
                  key={bundle.litres}
                  style={[styles.bundleCard, selected && styles.bundleCardSelected]}
                  onPress={() => setSelectedLitres(bundle.litres)}
                >
                  <Text style={[styles.bundleLitres, selected && styles.bundleTextSelected]}>
                    {bundle.litres.toLocaleString()}L
                  </Text>
                  <Text style={[styles.bundlePrice, selected && styles.bundleTextSelected]}>
                    {bundles.currency} {bundle.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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

        <View style={styles.cashCard}>
          <Text style={styles.cashLabel}>Payment method</Text>
          <Text style={styles.cashValue}>Cash on delivery</Text>
          {pricing && (
            <Text style={styles.cashTotal}>
              Total: {pricing.currency} {pricing.total.toFixed(2)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || !selectedLitres) && styles.buttonDisabled]}
          onPress={handleCreateOrder}
          disabled={loading || !selectedLitres}
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
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  bundleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  bundleCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  bundleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  bundleLitres: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  bundlePrice: { fontSize: 14, color: colors.textSecondary },
  bundleTextSelected: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 80 },
  cashCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cashLabel: { fontSize: 13, color: colors.textSecondary },
  cashValue: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  cashTotal: { fontSize: 14, color: colors.primary, marginTop: 8, fontWeight: "600" },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

const FREQUENCIES = [
  { value: "daily" as const, label: "Daily", discount: "15%" },
  { value: "weekly" as const, label: "Weekly", discount: "10%" },
  { value: "monthly" as const, label: "Monthly", discount: "5%" },
];

export default function ContractTabScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const createDraft = useMutation(api.contracts.createDraft);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [litres, setLitres] = useState("2000");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("morning");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!auth?.userId || !address.trim() || !startDate.trim()) return;
    setLoading(true);
    try {
      const contractId = await createDraft({
        customerId: auth.userId as any,
        frequency,
        litres: Number(litres) || 2000,
        addressText: address.trim(),
        preferredTime,
        startDate: startDate.trim(),
      });
      router.push({ pathname: "/(contract)/contact", params: { contractId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Recurring Contract</Text>
      <Text style={styles.subtitle}>Set up scheduled water deliveries</Text>

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.row}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, frequency === f.value && styles.chipActive]}
            onPress={() => setFrequency(f.value)}
          >
            <Text style={[styles.chipText, frequency === f.value && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Litres per delivery" value={litres} onChangeText={setLitres} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Delivery address" value={address} onChangeText={setAddress} multiline placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Preferred time (morning/afternoon)" value={preferredTime} onChangeText={setPreferredTime} placeholderTextColor={colors.textMuted} />

      <GradientButton title="Continue" onPress={submit} loading={loading} />
      <TouchableOpacity onPress={() => router.push("/(customer)/contract-management")}>
        <Text style={styles.link}>Manage existing contracts</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, marginBottom: 20 },
  label: { fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  chipText: { color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginBottom: 12, backgroundColor: colors.inputBackground, color: colors.text },
  link: { textAlign: "center", color: colors.cyan600, marginTop: 16 },
});

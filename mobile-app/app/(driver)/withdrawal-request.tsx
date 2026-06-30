import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function WithdrawalRequestScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const wallet = useQuery(api.wallets.getWallet, auth?.userId ? { userId: auth.userId as any } : "skip");
  const requestPayout = useMutation(api.payouts.requestPayout);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!auth?.userId) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert("Invalid amount", "Enter a positive amount.");
      return;
    }
    setLoading(true);
    try {
      await requestPayout({ userId: auth.userId as any, amount: value });
      Alert.alert("Submitted", "Your withdrawal request is pending review.");
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Withdrawal request" showBack>
      <View style={styles.body}>
        <Text style={styles.balance}>Available: {wallet?.currency ?? "USD"} {(wallet?.balance ?? 0).toFixed(2)}</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} />
        <GradientButton title="Request withdrawal" onPress={submit} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  balance: { fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.inputBackground, color: colors.text },
});

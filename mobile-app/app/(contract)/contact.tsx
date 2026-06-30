import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function ContractContactScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const updateContact = useMutation(api.contracts.updateContact);
  const [contactName, setContactName] = useState(auth?.fullName ?? "");
  const [contactPhone, setContactPhone] = useState(auth?.phoneE164 ?? "");
  const [loading, setLoading] = useState(false);

  const next = async () => {
    if (!auth?.userId || !contractId) return;
    setLoading(true);
    try {
      await updateContact({
        customerId: auth.userId as any,
        contractId: contractId as any,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
      });
      router.push({ pathname: "/(contract)/setup", params: { contractId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Contract contact" showBack>
      <View style={styles.body}>
        <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Contact name" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="Phone" placeholderTextColor={colors.textMuted} />
        <GradientButton title="Continue" onPress={next} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.inputBackground, color: colors.text },
});

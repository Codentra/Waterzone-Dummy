import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors } from "@/constants/theme";

export default function ContractSetupScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const activate = useMutation(api.contracts.activate);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!auth?.userId || !contractId) return;
    setLoading(true);
    try {
      await activate({
        contractId: contractId as any,
        customerId: auth.userId as any,
      });
      router.replace("/(customer)/contract-management");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Contract setup" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>Review your contract details and activate recurring deliveries.</Text>
        <GradientButton title="Activate contract" onPress={submit} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary, lineHeight: 22 },
});

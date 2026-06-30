import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function RateDriverScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const submit = useMutation(api.ratings.submit);
  const [stars, setStars] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!auth?.userId || !orderId) return;
    setLoading(true);
    try {
      await submit({
        orderId: orderId as any,
        customerId: auth.userId as any,
        stars: Math.min(5, Math.max(1, Number(stars) || 5)),
        comment: comment.trim() || undefined,
      });
      router.replace("/(customer-tabs)/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Rate driver" showBack>
      <View style={styles.body}>
        <Text>Stars (1-5)</Text>
        <TextInput style={styles.input} value={stars} onChangeText={setStars} keyboardType="number-pad" />
        <TextInput style={[styles.input, styles.multiline]} value={comment} onChangeText={setComment} placeholder="Comment (optional)" placeholderTextColor={colors.textMuted} multiline />
        <GradientButton title="Submit rating" onPress={onSubmit} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.inputBackground, color: colors.text },
  multiline: { minHeight: 100, textAlignVertical: "top" },
});

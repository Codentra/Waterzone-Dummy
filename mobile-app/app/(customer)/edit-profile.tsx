import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function EditProfileScreen() {
  const router = useRouter();
  const { auth, signIn } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);
  const [fullName, setFullName] = useState(auth?.fullName ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!auth?.userId) return;
    setLoading(true);
    try {
      await updateProfile({ userId: auth.userId as any, fullName: fullName.trim(), email: email.trim() || undefined });
      await signIn({ ...auth, fullName: fullName.trim() });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Edit profile" showBack>
      <View style={styles.body}>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} />
        <GradientButton title="Save" onPress={save} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.inputBackground, color: colors.text },
});

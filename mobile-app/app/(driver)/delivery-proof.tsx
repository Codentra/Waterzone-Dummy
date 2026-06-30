import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { uploadFileToConvex } from "@/lib/uploadDocument";
import { colors } from "@/constants/theme";

export default function DeliveryProofScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);
  const attachProof = useMutation(api.orders.attachDeliveryProof);
  const [loading, setLoading] = useState(false);
  const [uri, setUri] = useState<string | null>(null);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  };

  const submit = async () => {
    if (!auth?.userId || !orderId || !uri) return;
    setLoading(true);
    try {
      const storageId = await uploadFileToConvex(
        () => generateUploadUrl({ userId: auth.userId as any }),
        uri
      );
      await attachProof({ userId: auth.userId as any, orderId: orderId as any, storageId });
      Alert.alert("Saved", "Delivery proof attached.");
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Delivery proof" showBack>
      <View style={styles.body}>
        <Text style={styles.p}>Take a photo of the delivered water as proof.</Text>
        <GradientButton title={uri ? "Retake photo" : "Take photo"} onPress={pickPhoto} variant="outline" />
        {uri && <Text style={styles.ready}>Photo captured</Text>}
        <GradientButton title="Attach to order" onPress={submit} loading={loading} disabled={!uri} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  p: { color: colors.textSecondary },
  ready: { color: colors.cyan600, fontWeight: "600" },
});

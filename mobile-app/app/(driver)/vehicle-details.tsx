import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const driver = useQuery(api.drivers.getByUserId, auth?.userId ? { userId: auth.userId as any } : "skip");
  const updateVehicle = useMutation(api.drivers.updateVehicle);
  const [plate, setPlate] = useState(driver?.vehiclePlate ?? "");
  const [type, setType] = useState(driver?.vehicleType ?? "");
  const [makeModel, setMakeModel] = useState(driver?.profile?.vehicleMakeModel ?? "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!auth?.userId) return;
    setLoading(true);
    try {
      await updateVehicle({
        userId: auth.userId as any,
        vehiclePlate: plate.trim(),
        vehicleType: type.trim(),
        vehicleMakeModel: makeModel.trim() || undefined,
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Vehicle details" showBack>
      <View style={styles.body}>
        <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="Plate number" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Vehicle type" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} value={makeModel} onChangeText={setMakeModel} placeholder="Make & model" placeholderTextColor={colors.textMuted} />
        <GradientButton title="Save" onPress={save} loading={loading} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.inputBackground, color: colors.text },
});

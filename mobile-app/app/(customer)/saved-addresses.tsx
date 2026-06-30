import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ScreenShell } from "@/components/ScreenShell";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius } from "@/constants/theme";

export default function SavedAddressesScreen() {
  const { auth } = useAuth();
  const list = useQuery(api.addresses.listByUser, auth?.userId ? { userId: auth.userId as any } : "skip");
  const create = useMutation(api.addresses.create);
  const remove = useMutation(api.addresses.remove);
  const [label, setLabel] = useState("Home");
  const [addressText, setAddressText] = useState("");

  const add = async () => {
    if (!auth?.userId || !addressText.trim()) return;
    await create({ userId: auth.userId as any, label, addressText, isDefault: (list?.length ?? 0) === 0 });
    setAddressText("");
  };

  return (
    <ScreenShell title="Saved addresses" showBack>
      <View style={styles.body}>
        <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Label" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} value={addressText} onChangeText={setAddressText} placeholder="Address" placeholderTextColor={colors.textMuted} multiline />
        <GradientButton title="Add address" onPress={add} />
        <FlatList
          data={list ?? []}
          keyExtractor={(i) => i._id}
          style={{ marginTop: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.label}{item.isDefault ? " (default)" : ""}</Text>
              <Text>{item.addressText}</Text>
              <TouchableOpacity onPress={() => auth?.userId && remove({ userId: auth.userId as any, addressId: item._id })}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginBottom: 8, backgroundColor: colors.inputBackground, color: colors.text },
  card: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  cardTitle: { fontWeight: "600" },
  delete: { color: colors.errorText, marginTop: 8 },
});

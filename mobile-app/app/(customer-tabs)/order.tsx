import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { ProgressSteps } from "@/components/ProgressSteps";
import { GradientButton } from "@/components/GradientButton";
import { colors, radius, shadows } from "@/constants/theme";

export default function OrderWizardScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const bundles = useQuery(api.pricing.listBundles, {});
  const onlineDrivers = useQuery(api.drivers.listOnline, step === 3 ? {} : "skip");
  const addresses = useQuery(
    api.addresses.listByUser,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const createOrder = useMutation(api.orders.createOrder);
  const assignDriver = useMutation(api.orders.assignDriver);

  const [step, setStep] = useState(1);
  const [litres, setLitres] = useState<number | null>(2500);
  const [customMode, setCustomMode] = useState(false);
  const [customLitresInput, setCustomLitresInput] = useState("2500");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressText, setAddressText] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const minLitres = bundles?.minLitres ?? 2500;

  const pricing = useQuery(
    api.pricing.preview,
    litres && litres >= minLitres ? { litres } : "skip"
  );

  const selectPreset = (amount: number) => {
    setCustomMode(false);
    setLitres(amount);
    setCustomLitresInput(String(amount));
  };

  const applyCustomLitres = (text: string) => {
    setCustomLitresInput(text);
    setCustomMode(true);
    const parsed = Number(text.replace(/,/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      setLitres(parsed);
    } else {
      setLitres(null);
    }
  };

  const litresValid = litres !== null && litres >= minLitres;

  const continueFromQuantity = () => {
    if (!litresValid) {
      Alert.alert(
        "Invalid quantity",
        `Enter at least ${minLitres.toLocaleString()} litres.`
      );
      return;
    }
    setStep(2);
  };

  const placeOrder = async () => {
    if (!auth?.userId || !litres) return;
    const address =
      addressText.trim() ||
      addresses?.find((a) => a._id === selectedAddressId)?.addressText ||
      "";
    if (!address) {
      Alert.alert("Address required", "Select or enter a delivery address.");
      return;
    }
    setLoading(true);
    try {
      const orderId = await createOrder({
        customerId: auth.userId as any,
        litres,
        addressText: address,
        notes: notes.trim() || undefined,
        paymentMethod: "cash",
      });
      await assignDriver({ orderId, callerUserId: auth.userId as any });
      router.push({ pathname: "/(customer)/order-confirmation", params: { orderId } });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order Water</Text>
      <ProgressSteps step={step} />

      {step === 1 && (
        <>
          <Text style={styles.heading}>How much water?</Text>
          <View style={styles.bundleGrid}>
            {(bundles?.bundles ?? []).map((b) => {
              const selected = !customMode && litres === b.litres;
              return (
                <TouchableOpacity key={b.litres} onPress={() => selectPreset(b.litres)}>
                  {selected ? (
                    <LinearGradient colors={["#06b6d4", "#3b82f6"]} style={styles.bundleCard}>
                      <Text style={styles.bundleTextSel}>{b.litres.toLocaleString()}L</Text>
                      <Text style={styles.bundleTextSel}>${b.price.toFixed(2)}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.bundleCardPlain}>
                      <Text style={styles.bundleText}>{b.litres.toLocaleString()}L</Text>
                      <Text style={styles.bundleSub}>${b.price.toFixed(2)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.customCard, customMode && styles.customCardActive]}>
            <Text style={styles.customLabel}>Custom amount (litres)</Text>
            <Text style={styles.customHint}>Minimum {minLitres.toLocaleString()} L</Text>
            <TextInput
              style={styles.input}
              value={customLitresInput}
              onChangeText={applyCustomLitres}
              onFocus={() => setCustomMode(true)}
              keyboardType="number-pad"
              placeholder={`e.g. ${minLitres}`}
              placeholderTextColor={colors.textMuted}
            />
            {customMode && litres !== null && litres < minLitres && (
              <Text style={styles.customError}>
                Minimum order is {minLitres.toLocaleString()} L
              </Text>
            )}
            {customMode && litresValid && pricing && (
              <Text style={styles.customPrice}>
                Est. {pricing.currency} {pricing.total.toFixed(2)}
              </Text>
            )}
          </View>

          <GradientButton title="Continue" onPress={continueFromQuantity} disabled={!litresValid} />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.heading}>Delivery address</Text>
          {(addresses ?? []).map((a) => (
            <TouchableOpacity
              key={a._id}
              style={[styles.addrCard, selectedAddressId === a._id && styles.addrSelected]}
              onPress={() => {
                setSelectedAddressId(a._id);
                setAddressText(a.addressText);
              }}
            >
              <Text style={styles.addrLabel}>{a.label}</Text>
              <Text style={styles.addrText}>{a.addressText}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Or enter address manually"
            value={addressText}
            onChangeText={setAddressText}
            multiline
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor={colors.textMuted}
          />
          <GradientButton title="Continue" onPress={() => setStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.heading}>Order summary</Text>
          <View style={styles.summaryCard}>
            <Text>{litres?.toLocaleString()} L</Text>
            <Text>{addressText || "—"}</Text>
            <Text style={styles.total}>
              Total: {pricing?.currency ?? "USD"} {pricing?.total.toFixed(2) ?? "—"}
            </Text>
            <Text>Cash on delivery</Text>
          </View>

          <Text style={styles.trucksHeading}>Available trucks</Text>
          {(onlineDrivers ?? []).length === 0 ? (
            <Text style={styles.trucksEmpty}>No trucks online right now. Try again shortly.</Text>
          ) : (
            (onlineDrivers ?? []).map((d: any) => (
              <View key={d.driverId} style={[styles.truckCard, shadows.card]}>
                <View style={styles.truckAvatar}>
                  <Text style={styles.truckAvatarText}>{(d.driver?.vehicleType ?? "T")[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.truckName}>{d.driver?.vehiclePlate ?? "Driver"}</Text>
                  <Text style={styles.truckMeta}>{d.driver?.vehicleType}</Text>
                </View>
                <Text style={styles.available}>Available</Text>
              </View>
            ))
          )}

          <GradientButton title="Place order" onPress={placeOrder} loading={loading} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  bundleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  bundleCard: { padding: 16, borderRadius: radius.lg, minWidth: 100, alignItems: "center" },
  bundleCardPlain: { padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, minWidth: 100, alignItems: "center" },
  bundleText: { fontWeight: "700", color: colors.text },
  bundleSub: { color: colors.textSecondary },
  bundleTextSel: { fontWeight: "700", color: colors.white },
  customCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    backgroundColor: colors.white,
  },
  customCardActive: { borderColor: colors.cyan, backgroundColor: colors.cyan50 },
  customLabel: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  customHint: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  customError: { color: colors.errorText, fontSize: 13, marginTop: 8 },
  customPrice: { color: colors.cyan600, fontWeight: "600", marginTop: 8 },
  addrCard: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  addrSelected: { borderColor: colors.cyan, backgroundColor: colors.cyan50 },
  addrLabel: { fontWeight: "600" },
  addrText: { color: colors.textSecondary, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginBottom: 12, backgroundColor: colors.inputBackground, color: colors.text },
  summaryCard: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.cyan50, gap: 8, marginBottom: 20 },
  total: { fontWeight: "700", fontSize: 18, color: colors.cyan600 },
  trucksHeading: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  trucksEmpty: { color: colors.textSecondary, marginBottom: 16 },
  truckCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  truckAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  truckAvatarText: { color: colors.white, fontWeight: "700" },
  truckName: { fontWeight: "600", color: colors.text },
  truckMeta: { fontSize: 12, color: colors.textSecondary },
  available: { color: colors.green600, fontSize: 12, fontWeight: "600" },
});

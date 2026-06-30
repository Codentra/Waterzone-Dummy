"use client";

import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function RegisterPendingScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const driver = useQuery(
    api.drivers.getByUserId,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );

  useEffect(() => {
    if (!driver) return;
    if (driver.verificationStatus === "approved") {
      router.replace("/(driver-tabs)");
    }
  }, [driver, router]);

  if (driver === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rejected = driver?.verificationStatus === "rejected";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {rejected ? "Application not approved" : "Verification pending"}
      </Text>
      <Text style={styles.subtitle}>
        {rejected
          ? "Your driver application was reviewed and needs changes before you can operate."
          : "Your documents and profile are under review. You'll be able to go online once an admin approves your application."}
      </Text>
      {rejected && driver.rejectionReason ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{driver.rejectionReason}</Text>
        </View>
      ) : null}
      {rejected ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(auth)/driver-registration")}
        >
          <Text style={styles.buttonText}>Submit again</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.hint}>Checking for updates…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  reasonBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reasonLabel: { fontSize: 12, fontWeight: "700", color: "#991b1b", marginBottom: 4 },
  reasonText: { fontSize: 15, color: "#7f1d1d" },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
});

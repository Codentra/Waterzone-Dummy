import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

/**
 * Entry: role picker when no auth. "Continue as Customer" or "Continue as Driver".
 * Then create user and go to tabs or driver flow. Drivers auto-approved.
 */
export default function Index() {
  const router = useRouter();
  const { auth, loading: authLoading, signIn } = useAuth();
  const createUser = useMutation(api.users.createUser);
  const [loading, setLoading] = useState(false);

  const driverRecord = useQuery(
    api.drivers.getByUserId,
    auth?.role === "driver" && auth?.userId ? { userId: auth.userId as any } : "skip"
  );

  const handleRole = async (role: "customer" | "driver") => {
    if (loading) return;
    setLoading(true);
    try {
      const phone = role === "customer" ? "+263000000001" : "+263000000002";
      const name = role === "customer" ? "Guest Customer" : "Guest Driver";
      const userId = await createUser({
        fullName: name,
        phoneE164: phone,
        role,
      });
      await signIn({
        userId: userId as unknown as string,
        role,
        fullName: name,
        phoneE164: phone,
      });
    } catch (e) {
      setLoading(false);
    }
  };

  // Has auth: route by role
  useEffect(() => {
    if (!auth || authLoading) return;
    if (auth.role === "customer") {
      router.replace("/(tabs)");
      return;
    }
    if (auth.role === "driver") {
      if (driverRecord === undefined) return;
      if (!driverRecord) {
        router.replace("/driver/register");
        return;
      }
      if (driverRecord.verificationStatus === "pending" || driverRecord.verificationStatus === "rejected") {
        router.replace("/driver/register-pending");
        return;
      }
      router.replace("/(driver-tabs)");
    }
  }, [auth, authLoading, driverRecord, router]);

  // No auth: show role picker
  if (!authLoading && !auth) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Waterzone</Text>
        <Text style={styles.subtitle}>Continue as</Text>
        <TouchableOpacity
          style={[styles.button, styles.customerButton]}
          onPress={() => handleRole("customer")}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Customer</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.driverButton]}
          onPress={() => handleRole("driver")}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Driver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    maxWidth: 280,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  customerButton: {
    backgroundColor: colors.primary,
  },
  driverButton: {
    backgroundColor: colors.primaryDark ?? "#086888",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

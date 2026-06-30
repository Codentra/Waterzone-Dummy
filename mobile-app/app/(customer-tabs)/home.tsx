import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/providers/AuthProvider";
import { GradientHeader } from "@/components/GradientHeader";
import { colors, radius } from "@/constants/theme";

const DEFAULT_REGION = {
  latitude: -17.8252,
  longitude: 31.0335,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const HEADER_HIDE_MS = 10000;

export default function CustomerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMapExpanded(true), HEADER_HIDE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  const region = location
    ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : DEFAULT_REGION;

  const notificationsBtn = (
    <TouchableOpacity
      style={[styles.bell, mapExpanded && styles.bellFloating]}
      onPress={() => router.push("/(customer)/notifications")}
    >
      <Ionicons name="notifications-outline" size={22} color={mapExpanded ? colors.text : colors.white} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {!mapExpanded && (
        <GradientHeader
          greeting="Welcome back,"
          title={auth?.fullName ?? "Customer"}
          right={notificationsBtn}
        />
      )}

      <View style={[styles.mapWrap, mapExpanded && styles.mapWrapExpanded]}>
        <MapView style={styles.map} region={region} showsUserLocation showsMyLocationButton>
        </MapView>

        {mapExpanded && (
          <View style={[styles.floatingTopBar, { top: insets.top + 8 }]}>
            {notificationsBtn}
          </View>
        )}

        <TouchableOpacity
          style={[styles.orderFab, mapExpanded && styles.orderFabExpanded]}
          onPress={() => router.push("/(customer-tabs)/order")}
        >
          <LinearGradient colors={["#06b6d4", "#3b82f6"]} style={styles.orderFabInner}>
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.orderFabText}>Order Water</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.actionsPanel, mapExpanded && styles.actionsPanelFloating]}
        contentContainerStyle={[
          styles.actionsContent,
          mapExpanded && { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push("/(customer)/delivery-history")}>
          <Ionicons name="time-outline" size={20} color={colors.cyan600} />
          <Text style={styles.historyText}>Delivery history</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.reorderBtn} onPress={() => router.push("/(customer)/quick-reorder")}>
          <Text style={styles.reorderText}>Quick Reorder Last Delivery</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellFloating: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingTopBar: {
    position: "absolute",
    right: 16,
    zIndex: 20,
  },
  mapWrap: { flex: 1, minHeight: 280 },
  mapWrapExpanded: {
    ...StyleSheet.absoluteFillObject,
    minHeight: undefined,
    zIndex: 1,
  },
  map: { flex: 1 },
  orderFab: { position: "absolute", bottom: 16, alignSelf: "center" },
  orderFabExpanded: { bottom: 180 },
  orderFabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  orderFabText: { color: colors.white, fontWeight: "600" },
  actionsPanel: {
    maxHeight: 160,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  actionsPanelFloating: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 150,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  actionsContent: { padding: 16 },
  reorderBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  reorderText: { fontWeight: "600", color: colors.text },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cyan50,
    borderWidth: 1,
    borderColor: colors.cyan50,
  },
  historyText: { flex: 1, fontWeight: "600", color: colors.text },
});

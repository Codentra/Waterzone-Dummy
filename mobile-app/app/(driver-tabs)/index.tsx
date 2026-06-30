import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { GradientHeader } from "@/components/GradientHeader";
import { colors, radius, shadows } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  enroute: "En route",
  delivered: "Delivered",
};

const DEFAULT_REGION = {
  latitude: -17.8252,
  longitude: 31.0335,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const HEADER_HIDE_MS = 10000;

function EarningsIsland({
  currency,
  todayEarnings,
  style,
}: {
  currency: string;
  todayEarnings: number;
  style?: object;
}) {
  return (
    <View style={[styles.islandWrap, style]}>
      <View style={[styles.island, shadows.card]}>
        <Text style={styles.islandLabel}>Today's earnings</Text>
        <Text style={styles.islandAmount}>
          {currency} {todayEarnings.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

export default function DriverDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const driver = useQuery(
    api.drivers.getByUserId,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const status = useQuery(
    api.drivers.getStatus,
    driver?._id ? { driverId: driver._id } : "skip"
  );
  const orders = useQuery(
    api.orders.listByDriver,
    driver?._id ? { driverId: driver._id } : "skip"
  );
  const dashboardStats = useQuery(
    api.drivers.getDashboardStats,
    auth?.userId ? { userId: auth.userId as any } : "skip"
  );
  const updateStatus = useMutation(api.drivers.updateStatus);
  const updateLocation = useMutation(api.drivers.updateLocation);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  const isOnline = status?.isOnline ?? false;
  const currentOrder = orders?.find((o) => ["assigned", "accepted", "enroute"].includes(o.status));
  const deliveryGeo = currentOrder?.geo ?? null;

  const todayEarnings = dashboardStats?.todayEarnings ?? 0;
  const completedToday = dashboardStats?.completedToday ?? 0;
  const acceptanceRate = dashboardStats?.acceptanceRate ?? 0;
  const averageStars = dashboardStats?.averageStars ?? 0;
  const ratingCount = dashboardStats?.ratingCount ?? 0;
  const currency = dashboardStats?.currency ?? "USD";

  useEffect(() => {
    const t = setTimeout(() => setMapExpanded(true), HEADER_HIDE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({});
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(coords);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 15000,
        },
        (update) => {
          setLocation({
            lat: update.coords.latitude,
            lng: update.coords.longitude,
          });
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!auth?.userId || !isOnline || !location) return;

    updateLocation({
      userId: auth.userId as any,
      lastLocation: { lat: location.lat, lng: location.lng },
    }).catch(() => {});
  }, [auth?.userId, isOnline, location?.lat, location?.lng, updateLocation]);

  const onToggleOnline = async (value: boolean) => {
    if (!auth?.userId) return;
    try {
      await updateStatus({
        userId: auth.userId as any,
        isOnline: value,
        lastLocation: location ? { lat: location.lat, lng: location.lng } : undefined,
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const region = location
    ? {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: deliveryGeo ? 0.08 : 0.05,
        longitudeDelta: deliveryGeo ? 0.08 : 0.05,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      {!mapExpanded && (
        <>
          <GradientHeader
            variant="driver"
            greeting="Welcome back,"
            title={auth?.fullName ?? "Driver"}
          />
          <EarningsIsland currency={currency} todayEarnings={todayEarnings} />
        </>
      )}

      <View style={[styles.mapWrap, mapExpanded && styles.mapWrapExpanded]}>
        <MapView style={styles.map} region={region} showsUserLocation showsMyLocationButton>
          {deliveryGeo && (
            <Marker
              coordinate={{ latitude: deliveryGeo.lat, longitude: deliveryGeo.lng }}
              title="Delivery"
              description={currentOrder?.addressText}
              pinColor="#ef4444"
            />
          )}
        </MapView>

        {mapExpanded && (
          <EarningsIsland
            currency={currency}
            todayEarnings={todayEarnings}
            style={[styles.islandFloating, { top: insets.top + 8 }]}
          />
        )}

        {currentOrder && (
          <View style={[styles.mapOverlay, mapExpanded && { top: insets.top + 58 }]}>
            <Ionicons name="water" size={16} color={colors.cyan600} />
            <Text style={styles.mapOverlayText} numberOfLines={1}>
              {currentOrder.litres.toLocaleString()} L · {STATUS_LABELS[currentOrder.status] ?? currentOrder.status}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={[styles.panel, mapExpanded && styles.panelFloating]}
        contentContainerStyle={[
          styles.panelContent,
          mapExpanded && { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <LinearGradient
          colors={isOnline ? ["#14b8a6", "#06b6d4"] : ["#6b7280", "#9ca3af"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.onlineCard, shadows.card]}
        >
          <View style={styles.onlineRow}>
            <View style={styles.onlineText}>
              <Text style={styles.onlineTitle}>
                {isOnline ? "You're Online" : "You're Offline"}
              </Text>
              <Text style={styles.onlineSubtitle}>
                {isOnline ? "Ready to accept orders" : "Toggle to start receiving orders"}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={onToggleOnline}
              trackColor={{ false: "rgba(255,255,255,0.3)", true: "#22c55e" }}
              thumbColor="#fff"
            />
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle"
            label="Completed"
            value={String(completedToday)}
            sublabel="orders today"
            color={colors.green600}
            bg={colors.successLight}
          />
          <StatCard
            icon="thumbs-up"
            label="Acceptance"
            value={`${acceptanceRate}%`}
            sublabel="order rate"
            color={colors.blue}
            bg={colors.blue50}
          />
          <StatCard
            icon="star"
            label="Rating"
            value={ratingCount > 0 ? averageStars.toFixed(1) : "—"}
            sublabel={ratingCount > 0 ? `${ratingCount} reviews` : "no reviews"}
            color="#f59e0b"
            bg={colors.warningLight}
          />
        </View>

        {currentOrder && (
          <View style={[styles.deliveryCard, shadows.card]}>
            <View style={styles.deliveryHeader}>
              <Ionicons name="navigate" size={20} color={colors.cyan600} />
              <Text style={styles.deliveryTitle}>Current delivery</Text>
            </View>
            <Text style={styles.deliveryDetail}>
              {currentOrder.litres.toLocaleString()} L · {currentOrder.addressText}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[currentOrder.status] ?? currentOrder.status}
              </Text>
            </View>
            <Text style={styles.hint}>Use the Orders tab to Accept → En route → Delivered.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
  bg,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  sublabel: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }, shadows.card]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  islandWrap: {
    alignItems: "center",
    marginTop: -14,
    marginBottom: 2,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  islandFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    marginTop: 0,
    marginBottom: 0,
    zIndex: 20,
  },
  island: {
    backgroundColor: "#111827",
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
    minWidth: 168,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  islandLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  islandAmount: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.white,
  },
  mapWrap: { flex: 1, minHeight: 220, marginTop: 4 },
  mapWrapExpanded: {
    ...StyleSheet.absoluteFillObject,
    marginTop: 0,
    minHeight: undefined,
    zIndex: 1,
  },
  map: { flex: 1 },
  mapOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapOverlayText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.text },
  panel: { maxHeight: 320, backgroundColor: colors.white, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  panelFloating: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 300,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  panelContent: { padding: 16, paddingBottom: 24 },
  onlineCard: { borderRadius: radius.lg, padding: 20, marginBottom: 14 },
  onlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  onlineText: { flex: 1, paddingRight: 12 },
  onlineTitle: { color: colors.white, fontSize: 17, fontWeight: "700", marginBottom: 4 },
  onlineSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 6, marginBottom: 2, textAlign: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  statSublabel: { fontSize: 9, color: colors.textMuted, textAlign: "center", marginTop: 2 },
  deliveryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.cyan,
  },
  deliveryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  deliveryTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  deliveryDetail: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.cyan50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 10,
  },
  statusText: { color: colors.cyan600, fontWeight: "600", fontSize: 13 },
  hint: { fontSize: 12, color: colors.textMuted },
});

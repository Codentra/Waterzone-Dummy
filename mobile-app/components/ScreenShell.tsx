import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/constants/theme";

type Props = {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  style?: ViewStyle;
};

export function ScreenShell({ title, children, showBack, onBack, style }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }, style]}>
      {(showBack || title) && (
        <View style={styles.header}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack ?? (() => router.back())}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          {title ? <Text style={styles.headerTitle}>{title}</Text> : <View style={{ flex: 1 }} />}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  backPlaceholder: { width: 40 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
});

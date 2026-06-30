import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "@/constants/theme";

type Props = { step: number; total?: number };

export function ProgressSteps({ step, total = 3 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n <= step;
        return (
          <View key={n} style={styles.item}>
            {done ? (
              <LinearGradient
                colors={["#06b6d4", "#3b82f6"]}
                style={styles.circle}
              >
                <Text style={styles.circleText}>{n}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.circle, styles.circleInactive]}>
                <Text style={styles.circleTextInactive}>{n}</Text>
              </View>
            )}
            {n < total && (
              <View style={[styles.line, n < step && styles.lineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  item: { flex: 1, flexDirection: "row", alignItems: "center" },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInactive: { backgroundColor: colors.border },
  circleText: { color: colors.white, fontWeight: "700" },
  circleTextInactive: { color: colors.textMuted, fontWeight: "700" },
  line: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    borderRadius: radius.sm,
  },
  lineActive: { backgroundColor: colors.cyan },
});

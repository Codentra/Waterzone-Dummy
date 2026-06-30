import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, shadows } from "@/constants/theme";

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline" | "danger";
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
  textStyle,
}: Props) {
  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[styles.outline, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={colors.cyan600} />
        ) : (
          <Text style={[styles.outlineText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === "danger") {
    return (
      <TouchableOpacity
        style={[styles.danger, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={colors.errorText} />
        ) : (
          <Text style={[styles.dangerText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={disabled ? [colors.border, colors.border] : [...gradients.customer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.primary, shadows.button]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  outline: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  outlineText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  danger: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    alignItems: "center",
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dangerText: {
    color: colors.errorText,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: { opacity: 0.6 },
});

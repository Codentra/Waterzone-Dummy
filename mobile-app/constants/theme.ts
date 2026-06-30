/**
 * Waterzone design tokens — aligned with Figma Make export
 */
export const colors = {
  cyan: "#06b6d4",
  cyan600: "#0891b2",
  cyan50: "#ecfeff",
  blue: "#3b82f6",
  blue50: "#eff6ff",
  teal: "#14b8a6",
  teal500: "#14b8a6",
  primary: "#06b6d4",
  primaryDark: "#0891b2",
  background: "#ffffff",
  surface: "#f9fafb",
  card: "#ffffff",
  text: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  inputBackground: "#f3f4f6",
  success: "#22c55e",
  successLight: "#dcfce7",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  warningText: "#92400e",
  error: "#ef4444",
  errorLight: "#fef2f2",
  errorText: "#dc2626",
  white: "#ffffff",
  green600: "#16a34a",
  orange500: "#f97316",
  red500: "#ef4444",
} as const;

export const gradients = {
  customer: ["#06b6d4", "#3b82f6"] as const,
  driver: ["#14b8a6", "#06b6d4"] as const,
  wallet: ["#06b6d4", "#3b82f6", "#14b8a6"] as const,
  logo: ["#3b82f6", "#06b6d4", "#2dd4bf"] as const,
  customerIcon: ["#3b82f6", "#06b6d4"] as const,
  driverIcon: ["#14b8a6", "#06b6d4"] as const,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

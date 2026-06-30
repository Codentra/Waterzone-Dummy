import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@waterzone/auth_pending";

export type PendingAuth = {
  phoneE164: string;
  mode: "login" | "signup";
  role?: "customer" | "driver";
  fullName?: string;
  email?: string;
};

export async function getPendingAuth(): Promise<PendingAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAuth;
  } catch {
    return null;
  }
}

export async function setPendingAuth(data: PendingAuth): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function clearPendingAuth(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

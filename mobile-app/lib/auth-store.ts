import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@waterzone/auth";

export type StoredAuth = {
  userId: string;
  role: "customer" | "driver" | "admin";
  fullName: string;
  phoneE164: string;
};

export async function getStoredAuth(): Promise<StoredAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(auth));
}

export async function clearStoredAuth(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

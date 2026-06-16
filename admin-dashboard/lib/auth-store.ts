export type StoredAuth = {
  userId: string;
  fullName: string;
  phoneE164: string;
  role: "admin";
};

const KEY = "waterzone_admin_auth";

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth): void {
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(KEY);
}

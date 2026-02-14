import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  type StoredAuth,
} from "@/lib/auth-store";

type AuthState = {
  auth: StoredAuth | null;
  loading: boolean;
  signIn: (auth: StoredAuth) => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultAuthState: AuthState = {
  auth: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
};

const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredAuth().then((stored) => {
      setAuth(stored);
      setLoading(false);
    });
  }, []);

  const signIn = async (next: StoredAuth) => {
    await setStoredAuth(next);
    setAuth(next);
  };

  const signOut = async () => {
    await clearStoredAuth();
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

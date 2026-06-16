"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  type StoredAuth,
} from "@/lib/auth-store";

type AuthState = {
  auth: StoredAuth | null;
  loading: boolean;
  signIn: (auth: StoredAuth) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuth(getStoredAuth());
    setLoading(false);
  }, []);

  const signIn = (next: StoredAuth) => {
    setStoredAuth(next);
    setAuth(next);
  };

  const signOut = () => {
    clearStoredAuth();
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

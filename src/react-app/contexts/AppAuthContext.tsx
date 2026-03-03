"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LocalUser = {
  id: string;
  name: string;
  role?: string;
};

type AppAuthContextValue = {
  localUser: LocalUser | null;
  setLocalUser: (u: LocalUser | null) => void;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  // ✅ Minimal auth stub: reads a cached user from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("localUser");
      if (raw) setLocalUser(JSON.parse(raw));
      else setLocalUser({ id: "local", name: "Gestor", role: "admin" });
    } catch {
      setLocalUser({ id: "local", name: "Gestor", role: "admin" });
    }
  }, []);

  useEffect(() => {
    try {
      if (localUser) localStorage.setItem("localUser", JSON.stringify(localUser));
      else localStorage.removeItem("localUser");
    } catch {
      // ignore
    }
  }, [localUser]);

  const value = useMemo(() => ({ localUser, setLocalUser }), [localUser]);

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    // Don't throw to avoid breaking pages if provider wasn't mounted yet.
    return { localUser: null, setLocalUser: () => {} } as AppAuthContextValue;
  }
  return ctx;
}

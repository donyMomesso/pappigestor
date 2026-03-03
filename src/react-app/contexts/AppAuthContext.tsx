"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LocalUser = {
  id: string;
  name: string;
  role?: string;
  nome_empresa?: string; // ✅
};

type AppAuthContextValue = {
  localUser: LocalUser | null;
  setLocalUser: (u: LocalUser | null) => void;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  // lê do localStorage (client-only)
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

export function useAppAuth(): AppAuthContextValue {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    return {
      localUser: null,
      setLocalUser: () => {},
    };
  }
  return ctx;
}
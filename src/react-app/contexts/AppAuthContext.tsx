"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type LocalUser = {
  id: string;
  name: string;
  role?: string;
  email?: string;
  nome_empresa?: string;
};

type AuthContextType = {
  localUser: LocalUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AppAuthContext = createContext<AuthContextType | undefined>(undefined);

export function AppAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLocalUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setLocalUser({
        id: user.id,
        nome: profile?.nome,
        email: user.email,
        empresa_id: profile?.empresa_id,
        nivel_acesso: profile?.nivel_acesso,
      });

      setLoading(false);
    };

    loadUser();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setLocalUser(null);
    window.location.href = "/login";
  };

  const value = useMemo(
    () => ({ localUser, loading, logout }),
    [localUser, loading]
  );

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return context;
}
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

// ================================
// MODELO DE USUÁRIO LOCAL (SaaS)
// ================================
export interface LocalUser {
  id: string;
  email: string;
  nome: string;
  nivel_acesso: "admin" | "operador" | "viewer";
  empresa_id: string | null;
  nome_empresa: string;
  plano: string;
  foto?: string;
}

// ================================
// CONTEXTO
// ================================
interface AppAuthContextValue {
  localUser: LocalUser | null;
  setLocalUser: React.Dispatch<React.SetStateAction<LocalUser | null>>;
  isLoading: boolean;
  error: string | null;

  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  hasPermission: (allowed: string[]) => boolean;
  isSubscriptionExpired: () => boolean;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

// ================================
// PROVIDER
// ================================
export function AppAuthProvider({ children }: { children: ReactNode }) {

  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // MAPEAR USUÁRIO DO SUPABASE
  // ================================
  const mapUser = (user: any): LocalUser | null => {

    if (!user) return null;

    const metadata = user.user_metadata ?? {};

    return {
      id: String(user.id),
      email: String(user.email ?? ""),
      nome:
        metadata.full_name ||
        metadata.name ||
        "Gestor",

      nivel_acesso:
        metadata.nivel_acesso === "operador" ||
        metadata.nivel_acesso === "viewer"
          ? metadata.nivel_acesso
          : "admin",

      empresa_id: metadata.empresa_id ?? null,

      nome_empresa:
        metadata.nome_empresa ||
        "Minha Empresa",

      plano:
        metadata.plano ||
        "gratis",

      foto:
        metadata.avatar_url ||
        metadata.picture ||
        "",
    };
  };

  // ================================
  // BUSCAR SESSÃO
  // ================================
  const fetchSession = async () => {

    try {

      setIsLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const mappedUser = mapUser(session?.user);

      setLocalUser(mappedUser);

    } catch (err: any) {

      console.error("Auth error:", err);

      setError(err?.message || "Erro ao carregar sessão");
      setLocalUser(null);

    } finally {

      setIsLoading(false);

    }
  };

  // ================================
  // ESCUTAR LOGIN / LOGOUT
  // ================================
  useEffect(() => {

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {

      const mappedUser = mapUser(session?.user);

      setLocalUser(mappedUser);
      setIsLoading(false);

    });

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  // ================================
  // PERMISSÕES
  // ================================
  const hasPermission = (allowed: string[]) => {

    if (!localUser) return false;

    return allowed.includes(localUser.nivel_acesso);

  };

  // ================================
  // FUTURO: CONTROLE DE PLANO
  // ================================
  const isSubscriptionExpired = () => {

    if (!localUser) return true;

    // pode futuramente validar data
    return false;

  };

  // ================================
  // LOGOUT
  // ================================
  const signOut = async () => {

    try {

      await supabase.auth.signOut();

    } catch (err) {

      console.error("Erro ao sair:", err);

    } finally {

      setLocalUser(null);

      // evita estado quebrado
      window.location.href = "/login";

    }

  };

  // ================================
  // PROVIDER
  // ================================
  return (

    <AppAuthContext.Provider
      value={{
        localUser,
        setLocalUser,
        isLoading,
        error,
        signOut,
        refreshUser: fetchSession,
        hasPermission,
        isSubscriptionExpired,
      }}
    >
      {children}
    </AppAuthContext.Provider>

  );
}

// ================================
// HOOK OBRIGATÓRIO
// ================================
export function useAppAuth() {

  const context = useContext(AppAuthContext);

  if (!context) {
    throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  }

  return context;

}

// ================================
// HOOK OPCIONAL
// ================================
export function useAppAuthOptional() {

  return useContext(AppAuthContext);

}
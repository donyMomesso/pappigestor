"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

// Interface atualizada para suportar o modelo SaaS comercial com Planos
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

interface AppAuthContextValue {
  localUser: LocalUser | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (allowed: string[]) => boolean;
  isSubscriptionExpired: () => boolean;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapUser = (user: any): LocalUser | null => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      nome: user.user_metadata?.full_name || user.user_metadata?.name || "Gestor",
      nivel_acesso: user.user_metadata?.nivel_acesso || "admin",
      empresa_id: user.user_metadata?.empresa_id || null,
      nome_empresa: user.user_metadata?.nome_empresa || "Minha Empresa",
      plano: user.user_metadata?.plano || "Grátis",
      foto: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    };
  };

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setLocalUser(mapUser(session?.user));
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar sessão");
      setLocalUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLocalUser(mapUser(session?.user));
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (allowed: string[]) => {
    if (!localUser) return false;
    return allowed.includes(localUser.nivel_acesso);
  };

  const isSubscriptionExpired = () => {
    return false; // futuro
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setLocalUser(null);
    window.location.href = "/login";
  };

  return (
    <AppAuthContext.Provider
      value={{
        localUser,
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

// ✅ Mantém o seu hook forte (com throw)
export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  return context;
}

// ✅ Novo hook “opcional” (NÃO quebra layout público / landing / páginas abertas)
export function useAppAuthOptional() {
  return useContext(AppAuthContext);
}

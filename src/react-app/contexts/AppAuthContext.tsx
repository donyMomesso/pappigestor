"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { LocalUser, NivelAcesso, PlanoEmpresa } from "@/react-app/types/auth";
import { PLANO_FEATURES } from "@/react-app/types/auth";

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

  // RBAC (papéis)
  hasRole: (allowed: NivelAcesso[]) => boolean;

  // Plano / Feature da EMPRESA
  hasFeature: (feature: string) => boolean;

  // Permissão selecionada por usuário (dono define)
  hasPermission: (permission: string) => boolean;

  isSubscriptionExpired: () => boolean;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

// ================================
// HELPERS
// ================================
function normalizeRole(role: any): NivelAcesso {
  const r = String(role ?? "").toLowerCase().trim();

  // aceita legados
  if (r === "dono" || r === "owner") return "dono";
  if (r === "admin" || r === "admin_empresa") return "admin";
  if (r === "financeiro") return "financeiro";
  if (r === "comprador") return "comprador";
  if (r === "viewer" || r === "visualizador") return "viewer";
  return "operador";
}

function normalizePlano(plano: any): PlanoEmpresa {
  const p = String(plano ?? "").toLowerCase().trim();
  if (p === "gratis" || p === "grátis") return "gratis";
  if (p === "basico" || p === "básico") return "basico";
  if (p === "profissional") return "profissional";
  if (p === "enterprise" || p === "empresarial") return "enterprise";
  // default seguro
  return "gratis";
}

// ================================
// PROVIDER
// ================================
export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // MAPEAR USUÁRIO DO SUPABASE (metadata)
  // ================================
  const mapUser = (user: any): LocalUser | null => {
    if (!user) return null;

    const md = user.user_metadata ?? {};

    const role = normalizeRole(md.nivel_acesso ?? md.role);
    const plano = normalizePlano(md.plano ?? md.empresa_plano);

    return {
      id: String(user.id),
      email: String(user.email ?? ""),
      nome: md.full_name || md.name || "Gestor",

      empresa_id: md.empresa_id ?? null,
      nome_empresa: md.nome_empresa || "Minha Empresa",

      nivel_acesso: role,
      plano,

      foto: md.avatar_url || md.picture || "",

      // permissões por seleção (dono define)
      // Ex: ["compras","estoque","financeiro","ia"]
      permissoes: Array.isArray(md.permissoes) ? md.permissoes : [],
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

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================================
  // ROLE (RBAC)
  // ================================
  const hasRole = (allowed: NivelAcesso[]) => {
    if (!localUser) return false;
    if (localUser.nivel_acesso === "dono") return true;
    return allowed.includes(localUser.nivel_acesso);
  };

  // ================================
  // PLANO / FEATURE (EMPRESA)
  // ================================
  const hasFeature = (feature: string) => {
    if (!localUser) return false;
    if (localUser.nivel_acesso === "dono") return true;

    const featuresDoPlano = PLANO_FEATURES[localUser.plano] ?? [];
    return featuresDoPlano.includes(feature);
  };

  // ================================
  // PERMISSÃO (SELEÇÃO POR USUÁRIO)
  // ================================
  const hasPermission = (permission: string) => {
    if (!localUser) return false;
    if (localUser.nivel_acesso === "dono") return true;

    const perms = localUser.permissoes ?? [];
    return perms.includes(permission);
  };

  // ================================
  // CONTROLE DE PLANO (placeholder)
  // ================================
  const isSubscriptionExpired = () => {
    if (!localUser) return true;
    // futuramente validar vencimento
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
      window.location.href = "/login";
    }
  };

  const value = useMemo<AppAuthContextValue>(
    () => ({
      localUser,
      setLocalUser,
      isLoading,
      error,
      signOut,
      refreshUser: fetchSession,
      hasRole,
      hasFeature,
      hasPermission,
      isSubscriptionExpired,
    }),
    [localUser, isLoading, error]
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

// ================================
// HOOK OBRIGATÓRIO
// ================================
export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  return context;
}

// ================================
// HOOK OPCIONAL
// ================================
export function useAppAuthOptional() {
  return useContext(AppAuthContext);
}
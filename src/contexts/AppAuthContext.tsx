"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import type {
  LocalUser,
  NivelAcesso,
  PlanoEmpresa,
  Feature,
} from "@/react-app/types/auth";
import { PLANO_FEATURES } from "@/react-app/types/auth";

type MatchMode = "ANY" | "ALL";

interface AppAuthContextValue {
  localUser: LocalUser | null;
  setLocalUser: React.Dispatch<React.SetStateAction<LocalUser | null>>;
  isLoading: boolean;
  error: string | null;

  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // SaaS: role e permission aceitam 1 ou várias
  hasRole: (allowed: NivelAcesso | NivelAcesso[], mode?: MatchMode) => boolean;
  hasPermission: (permission: string | string[], mode?: MatchMode) => boolean;

  // Feature do plano
  hasFeature: (feature: Feature) => boolean;

  // Conveniência
  isSuperAdmin: boolean;

  isSubscriptionExpired: () => boolean;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

// ----------------------------
// Helpers
// ----------------------------
function toList<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

function hasAll(userList: string[], required: string[]) {
  return required.every((r) => userList.includes(r));
}

function hasAny(userList: string[], required: string[]) {
  return required.some((r) => userList.includes(r));
}

// ----------------------------
// Normalizadores (compatibilidade)
// ----------------------------
function normalizePlan(raw: any): PlanoEmpresa {
  const v = String(raw ?? "").trim().toLowerCase();

  if (v === "grátis" || v === "gratis") return "gratis";
  if (v === "básico" || v === "basico") return "basico";
  if (v === "pro" || v === "profissional") return "profissional";
  if (v === "enterprise") return "enterprise";

  return "gratis";
}

function normalizeRole(raw: any): NivelAcesso {
  const v = String(raw ?? "").trim().toLowerCase();

  // compat antigos
  if (v === "admin_empresa") return "dono";
  if (v === "super_admin") return "admin";

  // roles novas
  if (v === "dono") return "dono";
  if (v === "admin") return "admin";
  if (v === "financeiro") return "financeiro";
  if (v === "comprador") return "comprador";
  if (v === "operador") return "operador";
  if (v === "viewer") return "viewer";

  return "operador";
}

function parseStringArray(raw: any): string[] {
  try {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    const s = String(raw).trim();
    if (!s) return [];
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseFeatureArray(raw: any): Feature[] {
  const arr = parseStringArray(raw);
  return arr as Feature[];
}

// ----------------------------
// Provider
// ----------------------------
export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapUser = useCallback((user: any): LocalUser | null => {
    if (!user) return null;

    const meta = user.user_metadata ?? {};
    const email = String(user.email ?? "").trim().toLowerCase();

    const plano = normalizePlan(meta.plano);
    const nivel_acesso = normalizeRole(meta.nivel_acesso);

    const featuresFromMeta = parseFeatureArray(meta.features);
    const features = featuresFromMeta.length
      ? featuresFromMeta
      : PLANO_FEATURES[plano];

    return {
      id: String(user.id),
      email,
      nome: String(meta.full_name || meta.name || "Usuário"),
      nivel_acesso,
      empresa_id: meta.empresa_id ?? null,
      nome_empresa: String(meta.nome_empresa || meta.empresa_nome || "Minha Empresa"),
      plano,
      permissoes: parseStringArray(meta.permissoes),
      features,
      foto: String(meta.avatar_url || meta.picture || meta.foto || ""),
    };
  }, []);

  const fetchSession = useCallback(async () => {
    const supabase = getSupabaseClient();

    // modo sem Supabase configurado (não quebra build)
    if (!supabase) {
      setLocalUser(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const mapped = mapUser(data.session?.user);
      setLocalUser(mapped);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err?.message || "Erro ao carregar sessão");
      setLocalUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [mapUser]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // sempre tenta carregar sessão (se tiver supabase)
    fetchSession();

    // sem supabase = modo offline
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const mapped = mapUser(session?.user);
        setLocalUser(mapped);
        setIsLoading(false);
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [fetchSession, mapUser]);

  // --- Computados de segurança (SaaS) ---
  const userPerms = localUser?.permissoes ?? [];

  const computedIsSuperAdmin =
    localUser?.nivel_acesso === "admin" || userPerms.includes("super_admin");

  // Role (nivel_acesso) — aceita 1 ou vários, ANY/ALL
  const hasRole = (allowed: NivelAcesso | NivelAcesso[], mode: MatchMode = "ANY") => {
    if (!localUser) return false;
    if (computedIsSuperAdmin) return true;

    const required = toList(allowed);

    if (mode === "ALL") {
      return required.length === 1 && required[0] === localUser.nivel_acesso;
    }
    return required.includes(localUser.nivel_acesso);
  };

  // Permission — aceita 1 ou várias, ANY/ALL
  const hasPermission = (permission: string | string[], mode: MatchMode = "ANY") => {
    if (!localUser) return false;
    if (computedIsSuperAdmin) return true;

    // dono passa tudo (se quiser tirar, remova)
    if (localUser.nivel_acesso === "dono") return true;

    const required = toList(permission);

    if (required.length === 0) return true;

    return mode === "ALL" ? hasAll(userPerms, required) : hasAny(userPerms, required);
  };

  const hasFeature = (feature: Feature) => {
    if (!localUser) return false;
    const list = localUser.features ?? PLANO_FEATURES[localUser.plano];
    return list.includes(feature);
  };

  const isSubscriptionExpired = () => {
    if (!localUser) return true;
    // depois você pluga vencimento aqui
    return false;
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();

    try {
      if (supabase) await supabase.auth.signOut();
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
      isSuperAdmin: computedIsSuperAdmin,
      isSubscriptionExpired,
    }),
    [localUser, isLoading, error, fetchSession, computedIsSuperAdmin]
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

// ----------------------------
// Hooks
// ----------------------------
export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  return ctx;
}

export function useAppAuthOptional() {
  return useContext(AppAuthContext);
}
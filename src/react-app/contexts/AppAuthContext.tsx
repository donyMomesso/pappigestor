"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { LocalUser, NivelAcesso, PlanoEmpresa, Feature } from "@/react-app/types/auth";
import { PLANO_FEATURES } from "@/react-app/types/auth";

interface AppAuthContextValue {
  localUser: LocalUser | null;
  setLocalUser: React.Dispatch<React.SetStateAction<LocalUser | null>>;
  isLoading: boolean;
  error: string | null;

  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Permissão por role (simples)
  hasRole: (allowed: NivelAcesso[]) => boolean;

  // Permissão por feature do plano
  hasFeature: (feature: Feature) => boolean;

  // Permissão por "permissoes" finas (se usar)
  hasPermission: (permission: string) => boolean;

  isSubscriptionExpired: () => boolean;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

// ----------------------------
// Normalizadores (compatibilidade)
// ----------------------------
function normalizePlan(raw: any): PlanoEmpresa {
  const v = String(raw ?? "").trim().toLowerCase();

  // compat antigos
  if (v === "grátis" || v === "gratis") return "gratis";
  if (v === "básico" || v === "basico") return "basico";
  if (v === "pro" || v === "profissional") return "profissional";
  if (v === "enterprise") return "enterprise";

  // default seguro
  return "gratis";
}

function normalizeRole(raw: any): NivelAcesso {
  const v = String(raw ?? "").trim().toLowerCase();

  // compat antigos (se aparecer do banco/metadata)
  if (v === "admin_empresa") return "dono";
  if (v === "super_admin") return "admin";

  // roles novas
  if (v === "dono") return "dono";
  if (v === "admin") return "admin";
  if (v === "financeiro") return "financeiro";
  if (v === "comprador") return "comprador";
  if (v === "operador") return "operador";
  if (v === "viewer") return "viewer";

  // default seguro (nunca dá admin sem querer)
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

  const mapUser = (user: any): LocalUser | null => {
    if (!user) return null;

    const meta = user.user_metadata ?? {};
    const email = String(user.email ?? "").trim().toLowerCase();

    const plano = normalizePlan(meta.plano);
    const nivel_acesso = normalizeRole(meta.nivel_acesso);

    const featuresFromMeta = parseFeatureArray(meta.features);
    const features = featuresFromMeta.length ? featuresFromMeta : PLANO_FEATURES[plano];

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
  };

  const fetchSession = async () => {
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
  };

  useEffect(() => {
    fetchSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const mapped = mapUser(session?.user);
      setLocalUser(mapped);
      setIsLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRole = (allowed: NivelAcesso[]) => {
    if (!localUser) return false;
    return allowed.includes(localUser.nivel_acesso);
  };

  const hasFeature = (feature: Feature) => {
    if (!localUser) return false;
    const list = localUser.features ?? PLANO_FEATURES[localUser.plano];
    return list.includes(feature);
  };

  const hasPermission = (permission: string) => {
    if (!localUser) return false;

    // dono sempre passa (você pode tirar isso se quiser)
    if (localUser.nivel_acesso === "dono") return true;

    const perms = localUser.permissoes ?? [];
    return perms.includes(permission);
  };

  const isSubscriptionExpired = () => {
    if (!localUser) return true;
    // depois você pluga vencimento aqui
    return false;
  };

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
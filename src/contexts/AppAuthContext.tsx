"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import type {
  Feature,
  LocalUser,
  NivelAcesso,
  PlanoEmpresa,
} from "@/react-app/types/auth";
import { PLANO_FEATURES } from "@/react-app/types/auth";
import { setEmpresaId } from "@/react-app/lib/empresa";

type MatchMode = "ANY" | "ALL";

type AppAuthContextValue = {
  localUser: LocalUser | null;
  setLocalUser: React.Dispatch<React.SetStateAction<LocalUser | null>>;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (allowed: NivelAcesso | NivelAcesso[], mode?: MatchMode) => boolean;
  hasPermission: (permission: string | string[], mode?: MatchMode) => boolean;
  hasFeature: (feature: Feature) => boolean;
  isSuperAdmin: boolean;
  isSubscriptionExpired: () => boolean;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

function toList<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

function hasAll(userList: string[], required: string[]) {
  return required.every((r) => userList.includes(r));
}

function hasAny(userList: string[], required: string[]) {
  return required.some((r) => userList.includes(r));
}

function normalizePlan(raw: unknown): PlanoEmpresa {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "grátis" || v === "gratis") return "gratis";
  if (v === "básico" || v === "basico") return "basico";
  if (v === "pro" || v === "profissional") return "profissional";
  if (v === "enterprise") return "enterprise";
  return "profissional";
}

function normalizeRole(raw: unknown): NivelAcesso {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "admin_empresa") return "dono";
  if (v === "super_admin") return "admin";
  if (v === "dono") return "dono";
  if (v === "admin") return "admin";
  if (v === "financeiro") return "financeiro";
  if (v === "comprador") return "comprador";
  if (v === "viewer") return "viewer";
  return "operador";
}

function parseStringArray(raw: unknown): string[] {
  try {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseFeatureArray(raw: unknown): Feature[] {
  return parseStringArray(raw) as Feature[];
}

function loadLocalUserFromStorage(): LocalUser | null {
  if (typeof window === "undefined") return null;

  try {
    const id = localStorage.getItem("user_id") || "";
    const email =
      (localStorage.getItem("userEmail") ||
        localStorage.getItem("user_email") ||
        localStorage.getItem("email") ||
        "")
        .trim()
        .toLowerCase();
    const nome = localStorage.getItem("userName") || "Usuário";
    const empresa_id =
      localStorage.getItem("empresa_id") ||
      localStorage.getItem("pId") ||
      localStorage.getItem("pizzariaId") ||
      null;

    if (!id && !email && !empresa_id) return null;

    const nome_empresa =
      localStorage.getItem("nome_empresa") ||
      localStorage.getItem("empresa_nome") ||
      "Minha Empresa";
    const plano = normalizePlan(localStorage.getItem("plano"));
    const nivel_acesso = normalizeRole(localStorage.getItem("nivel_acesso"));
    const permissoes = parseStringArray(localStorage.getItem("permissoes"));
    const features = parseFeatureArray(localStorage.getItem("features"));
    const foto = localStorage.getItem("userAvatar") || "";

    return {
      id,
      email,
      nome,
      empresa_id,
      nome_empresa,
      plano,
      nivel_acesso,
      permissoes,
      features: features.length ? features : PLANO_FEATURES[plano],
      foto,
    };
  } catch {
    return null;
  }
}

function persistLocalUserToStorage(user: LocalUser | null) {
  if (typeof window === "undefined") return;

  const keys = [
    "user_id",
    "userEmail",
    "user_email",
    "email",
    "userName",
    "empresa_id",
    "pId",
    "pizzariaId",
    "nome_empresa",
    "empresa_nome",
    "plano",
    "nivel_acesso",
    "permissoes",
    "features",
    "userAvatar",
  ];

  if (!user) {
    keys.forEach((key) => localStorage.removeItem(key));
    return;
  }

  localStorage.setItem("user_id", String(user.id ?? ""));
  localStorage.setItem("userEmail", String(user.email ?? ""));
  localStorage.setItem("user_email", String(user.email ?? ""));
  localStorage.setItem("email", String(user.email ?? ""));
  localStorage.setItem("userName", String(user.nome ?? ""));
  localStorage.setItem("empresa_id", String(user.empresa_id ?? ""));
  localStorage.setItem("pId", String(user.empresa_id ?? ""));
  localStorage.setItem("pizzariaId", String(user.empresa_id ?? ""));
  localStorage.setItem("nome_empresa", String(user.nome_empresa ?? ""));
  localStorage.setItem("empresa_nome", String(user.nome_empresa ?? ""));
  localStorage.setItem("plano", String(user.plano ?? "profissional"));
  localStorage.setItem("nivel_acesso", String(user.nivel_acesso ?? "operador"));
  localStorage.setItem("permissoes", JSON.stringify(user.permissoes ?? []));
  localStorage.setItem("features", JSON.stringify(user.features ?? []));
  localStorage.setItem("userAvatar", String(user.foto ?? ""));
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [localUser, setLocalUserState] = useState<LocalUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const setLocalUser = useCallback(
    (value: React.SetStateAction<LocalUser | null>) => {
      setLocalUserState((prev) => {
        const next = typeof value === "function" ? (value as (p: LocalUser | null) => LocalUser | null)(prev) : value;
        persistLocalUserToStorage(next);
        return next;
      });
    },
    []
  );

  const refreshUser = useCallback(async () => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user?.email) {
      setLocalUser(null);
      setError(null);
      setHydrated(true);
      return;
    }

    const fallback = loadLocalUserFromStorage();
    const baseEmail = String(session.user.email || fallback?.email || "").trim().toLowerCase();
    const baseName = String(session.user.name || fallback?.nome || "Usuário");
    const baseImage = String(session.user.image || fallback?.foto || "");

    try {
      let appSession: Record<string, unknown> | null = null;
      const appSessionResponse = await fetch("/api/app/session", { cache: "no-store" }).catch(() => null);
      if (appSessionResponse?.ok) {
        appSession = await appSessionResponse.json().catch(() => null);
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: baseEmail }),
      });

      let profile: Record<string, unknown> | null = null;
      if (response.ok) {
        profile = await response.json().catch(() => null);
      }

      const empresaAtual = (appSession?.empresaAtual as Record<string, unknown> | undefined) ?? null;
      const sessionUser = (appSession?.user as Record<string, unknown> | undefined) ?? null;
      const membership = (appSession?.membership as Record<string, unknown> | undefined) ?? null;

      const empresaId =
        String(empresaAtual?.id || profile?.empresa_id || fallback?.empresa_id || "").trim() || null;
      const role = normalizeRole(membership?.role || profile?.role || fallback?.nivel_acesso || "operador");
      const plano = normalizePlan(empresaAtual?.plano || profile?.plano || fallback?.plano || "profissional");
      const nomeEmpresa =
        String(empresaAtual?.nome || profile?.nome_empresa || fallback?.nome_empresa || "Minha Empresa");
      const sessionFeatures = Array.isArray(empresaAtual?.features) ? (empresaAtual?.features as Feature[]) : [];
      const features =
        sessionFeatures.length
          ? sessionFeatures
          : fallback?.features && fallback.features.length
          ? fallback.features
          : PLANO_FEATURES[plano];

      const sessionPerms =
  Array.isArray(sessionUser?.permissoes)
    ? sessionUser.permissoes.map(String)
    : Array.isArray(membership?.permissoes)
    ? membership.permissoes.map(String)
    : Array.isArray(profile?.permissoes)
    ? profile.permissoes.map(String)
    : fallback?.permissoes || [];

setLocalUser({
  id: String((session.user as { id?: string })?.id || sessionUser?.id || fallback?.id || baseEmail),
  email: baseEmail,
  nome: String(sessionUser?.nome || profile?.nome || baseName),
  nivel_acesso: role,
  empresa_id: empresaId,
  nome_empresa: nomeEmpresa,
  plano,
  permissoes: sessionPerms,
  features,
  foto: String(sessionUser?.foto || baseImage),
});
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao carregar usuário");
      setLocalUser(
        fallback || {
          id: String((session.user as { id?: string })?.id || baseEmail),
          email: baseEmail,
          nome: baseName,
          nivel_acesso: "operador",
          empresa_id: null,
          nome_empresa: "Minha Empresa",
          plano: "profissional",
          permissoes: [],
          features: PLANO_FEATURES.profissional,
          foto: baseImage,
        }
      );
    } finally {
      setHydrated(true);
    }
  }, [session, setLocalUser, status]);

  useEffect(() => {
    const fallback = loadLocalUserFromStorage();
    if (fallback) {
      setLocalUserState(fallback);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const userPerms = localUser?.permissoes ?? [];
  const isSuperAdmin = localUser?.nivel_acesso === "admin" || userPerms.includes("super_admin");

  const hasRole = useCallback(
    (allowed: NivelAcesso | NivelAcesso[], mode: MatchMode = "ANY") => {
      if (!localUser) return false;
      if (isSuperAdmin) return true;
      const required = toList(allowed);
      return mode === "ALL"
        ? required.length === 1 && required[0] === localUser.nivel_acesso
        : required.includes(localUser.nivel_acesso);
    },
    [isSuperAdmin, localUser]
  );

  const hasPermission = useCallback(
    (permission: string | string[], mode: MatchMode = "ANY") => {
      if (!localUser) return false;
      if (isSuperAdmin || localUser.nivel_acesso === "dono") return true;
      const required = toList(permission);
      if (!required.length) return true;
      return mode === "ALL" ? hasAll(userPerms, required) : hasAny(userPerms, required);
    },
    [isSuperAdmin, localUser, userPerms]
  );

  const hasFeature = useCallback(
    (feature: Feature) => {
      if (!localUser) return false;
      const features = localUser.features ?? PLANO_FEATURES[localUser.plano];
      return features.includes(feature);
    },
    [localUser]
  );

  const logout = useCallback(async () => {
    setLocalUser(null);
    await nextAuthSignOut({ callbackUrl: "/login" });
  }, [setLocalUser]);

  const value = useMemo<AppAuthContextValue>(
    () => ({
      localUser,
      setLocalUser,
      isLoading: !hydrated || status === "loading",
      loading: !hydrated || status === "loading",
      error,
      signOut: logout,
      logout,
      refreshUser,
      hasRole,
      hasPermission,
      hasFeature,
      isSuperAdmin,
      isSubscriptionExpired: () => false,
    }),
    [error, hasFeature, hasPermission, hasRole, hydrated, isSuperAdmin, localUser, logout, refreshUser, setLocalUser, status]
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  }
  return ctx;
}

export function useAppAuthOptional() {
  return useContext(AppAuthContext);
}
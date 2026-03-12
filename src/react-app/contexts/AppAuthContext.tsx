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
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabaseClient";
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
  loading: boolean;

  error: string | null;

  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  hasRole: (allowed: NivelAcesso | NivelAcesso[], mode?: MatchMode) => boolean;
  hasPermission: (permission: string | string[], mode?: MatchMode) => boolean;
  hasFeature: (feature: Feature) => boolean;

  isSuperAdmin: boolean;
  isSubscriptionExpired: () => boolean;
}

const defaultAppAuthContextValue: AppAuthContextValue = {
  localUser: null,
  setLocalUser: () => {
    // noop
  },
  isLoading: true,
  loading: true,
  error: null,
  signOut: async () => {
    // noop
  },
  refreshUser: async () => {
    // noop
  },
  hasRole: () => false,
  hasPermission: () => false,
  hasFeature: () => false,
  isSuperAdmin: false,
  isSubscriptionExpired: () => true,
};

const AppAuthContext = createContext<AppAuthContextValue>(
  defaultAppAuthContextValue
);

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

  return "gratis";
}

function normalizeRole(raw: unknown): NivelAcesso {
  const v = String(raw ?? "").trim().toLowerCase();

  if (v === "admin_empresa") return "dono";
  if (v === "super_admin") return "admin";

  if (v === "dono") return "dono";
  if (v === "admin") return "admin";
  if (v === "financeiro") return "financeiro";
  if (v === "comprador") return "comprador";
  if (v === "operador") return "operador";
  if (v === "viewer") return "viewer";

  return "operador";
}

function parseStringArray(raw: unknown): string[] {
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

function parseFeatureArray(raw: unknown): Feature[] {
  return parseStringArray(raw) as Feature[];
}

function loadLocalUserFromStorage(): LocalUser | null {
  if (typeof window === "undefined") return null;

  try {
    const id = localStorage.getItem("user_id") || "";
    const email = (localStorage.getItem("userEmail") || "")
      .trim()
      .toLowerCase();
    const nome = localStorage.getItem("userName") || "Usuário";
    const empresa_id =
      localStorage.getItem("empresa_id") ||
      localStorage.getItem("pId") ||
      localStorage.getItem("pizzariaId") ||
      null;

    const nome_empresa =
      localStorage.getItem("nome_empresa") ||
      localStorage.getItem("empresa_nome") ||
      "Minha Empresa";

    const plano = normalizePlan(localStorage.getItem("plano"));
    const nivel_acesso = normalizeRole(localStorage.getItem("nivel_acesso"));
    const permissoes = parseStringArray(localStorage.getItem("permissoes"));
    const featuresStorage = parseFeatureArray(localStorage.getItem("features"));
    const foto = localStorage.getItem("userAvatar") || "";

    if (!id && !email && !empresa_id) {
      return null;
    }

    return {
      id: id || "",
      email,
      nome,
      nivel_acesso,
      empresa_id,
      nome_empresa,
      plano,
      permissoes,
      features: featuresStorage.length
        ? featuresStorage
        : PLANO_FEATURES[plano],
      foto,
    };
  } catch (error) {
    console.error("Erro ao ler localStorage do auth:", error);
    return null;
  }
}

function persistLocalUserToStorage(user: LocalUser | null) {
  if (typeof window === "undefined") return;

  try {
    if (!user) {
      localStorage.removeItem("user_id");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("empresa_id");
      localStorage.removeItem("pId");
      localStorage.removeItem("pizzariaId");
      localStorage.removeItem("nome_empresa");
      localStorage.removeItem("empresa_nome");
      localStorage.removeItem("plano");
      localStorage.removeItem("nivel_acesso");
      localStorage.removeItem("permissoes");
      localStorage.removeItem("features");
      localStorage.removeItem("userAvatar");
      return;
    }

    localStorage.setItem("user_id", String(user.id ?? ""));
    localStorage.setItem("userEmail", String(user.email ?? ""));
    localStorage.setItem("userName", String(user.nome ?? ""));
    localStorage.setItem("empresa_id", String(user.empresa_id ?? ""));
    localStorage.setItem("pId", String(user.empresa_id ?? ""));
    localStorage.setItem("pizzariaId", String(user.empresa_id ?? ""));
    localStorage.setItem("nome_empresa", String(user.nome_empresa ?? ""));
    localStorage.setItem("empresa_nome", String(user.nome_empresa ?? ""));
    localStorage.setItem("plano", String(user.plano ?? "gratis"));
    localStorage.setItem(
      "nivel_acesso",
      String(user.nivel_acesso ?? "operador")
    );
    localStorage.setItem("permissoes", JSON.stringify(user.permissoes ?? []));
    localStorage.setItem("features", JSON.stringify(user.features ?? []));
    localStorage.setItem("userAvatar", String(user.foto ?? ""));
  } catch (error) {
    console.error("Erro ao salvar localStorage do auth:", error);
  }
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUserState] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setLocalUser = useCallback(
    (value: React.SetStateAction<LocalUser | null>) => {
      setLocalUserState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        persistLocalUserToStorage(next);
        return next;
      });
    },
    []
  );

  const mapUser = useCallback((user: User | null): LocalUser | null => {
    if (!user) return null;

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const email = String(user.email ?? "").trim().toLowerCase();

    const plano = normalizePlan(meta.plano);
    const nivel_acesso = normalizeRole(meta.nivel_acesso);

    const featuresFromMeta = parseFeatureArray(meta.features);
    const features = featuresFromMeta.length
      ? featuresFromMeta
      : PLANO_FEATURES[plano];

    return {
      id: String(user.id ?? ""),
      email,
      nome: String(meta.full_name || meta.name || "Usuário"),
      nivel_acesso,
      empresa_id: (meta.empresa_id as string | null | undefined) ?? null,
      nome_empresa: String(
        meta.nome_empresa || meta.empresa_nome || "Minha Empresa"
      ),
      plano,
      permissoes: parseStringArray(meta.permissoes),
      features,
      foto: String(meta.avatar_url || meta.picture || meta.foto || ""),
    };
  }, []);

  const fetchSession = useCallback(async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const fallbackUser = loadLocalUserFromStorage();
      setLocalUserState(fallbackUser);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const mapped = mapUser(data.session?.user ?? null);

      if (mapped) {
        setLocalUser(mapped);
      } else {
        const fallbackUser = loadLocalUserFromStorage();
        setLocalUserState(fallbackUser);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar sessão");

      const fallbackUser = loadLocalUserFromStorage();
      setLocalUserState(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  }, [mapUser, setLocalUser]);

  useEffect(() => {
    const localFallback = loadLocalUserFromStorage();
    if (localFallback) {
      setLocalUserState(localFallback);
    }

    void fetchSession();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const mapped = mapUser(session?.user ?? null);

        if (mapped) {
          setLocalUser(mapped);
        } else {
          const fallbackUser = loadLocalUserFromStorage();
          setLocalUserState(fallbackUser);
        }

        setIsLoading(false);
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [fetchSession, mapUser, setLocalUser]);

  const userPerms = localUser?.permissoes ?? [];

  const computedIsSuperAdmin =
    localUser?.nivel_acesso === "admin" || userPerms.includes("super_admin");

  const hasRole = useCallback(
    (allowed: NivelAcesso | NivelAcesso[], mode: MatchMode = "ANY") => {
      if (!localUser) return false;
      if (computedIsSuperAdmin) return true;

      const required = toList(allowed);

      if (mode === "ALL") {
        return required.length === 1 && required[0] === localUser.nivel_acesso;
      }

      return required.includes(localUser.nivel_acesso);
    },
    [localUser, computedIsSuperAdmin]
  );

  const hasPermission = useCallback(
    (permission: string | string[], mode: MatchMode = "ANY") => {
      if (!localUser) return false;
      if (computedIsSuperAdmin) return true;
      if (localUser.nivel_acesso === "dono") return true;

      const required = toList(permission);
      if (required.length === 0) return true;

      return mode === "ALL"
        ? hasAll(userPerms, required)
        : hasAny(userPerms, required);
    },
    [localUser, computedIsSuperAdmin, userPerms]
  );

  const hasFeature = useCallback(
    (feature: Feature) => {
      if (!localUser) return false;
      const list = localUser.features ?? PLANO_FEATURES[localUser.plano];
      return list.includes(feature);
    },
    [localUser]
  );

  const isSubscriptionExpired = useCallback(() => {
    if (!localUser) return true;
    return false;
  }, [localUser]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      setLocalUser(null);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [setLocalUser]);

  const value = useMemo<AppAuthContextValue>(
    () => ({
      localUser,
      setLocalUser,
      isLoading,
      loading: isLoading,
      error,
      signOut,
      refreshUser: fetchSession,
      hasRole,
      hasFeature,
      hasPermission,
      isSuperAdmin: computedIsSuperAdmin,
      isSubscriptionExpired,
    }),
    [
      localUser,
      setLocalUser,
      isLoading,
      error,
      signOut,
      fetchSession,
      hasRole,
      hasFeature,
      hasPermission,
      computedIsSuperAdmin,
      isSubscriptionExpired,
    ]
  );

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AppAuthContext);
}

export function useAppAuthOptional() {
  return useContext(AppAuthContext);
}
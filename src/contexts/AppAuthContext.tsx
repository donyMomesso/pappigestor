"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// Importa o tipo LocalUser do arquivo onde ele realmente existe
import type { LocalUser as TypesLocalUser } from "../types/auth";

/**
 * Context value local (definido aqui para não depender de export inexistente)
 * Inclui os campos que os componentes do projeto esperam usar.
 */
type AppAuthContextValue = {
  localUser: TypesLocalUser | null;
  isLoading: boolean;
  hasRole?: (role: string) => boolean;
  isSuperAdmin?: boolean;
  refresh?: () => Promise<void>;
  signOut: () => Promise<void>;
};

type SessionUserExtra = {
  name?: string | null;
  email?: string | null;
  empresa_id?: string | null;
  role?: string | null;
};

const DEFAULT_CTX: AppAuthContextValue = {
  localUser: null,
  isLoading: true,
  hasRole: () => false,
  isSuperAdmin: false,
  refresh: async () => {},
  signOut: async () => {},
};

const AppAuthContext = createContext<AppAuthContextValue>(DEFAULT_CTX);

export function useAppAuth() {
  return useContext(AppAuthContext);
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [localUser, setLocalUser] = useState<TypesLocalUser | null | undefined>(undefined);

  const router = useRouter();
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw ?? "";

  const isLoading = status === "loading";
  const sessionUser = (session?.user ?? null) as SessionUserExtra | null;

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      return data?.localUser ?? data;
    } catch (err) {
      console.warn("[AppAuth] fetchProfile error:", err);
      return null;
    }
  }

  async function refresh() {
    try {
      const profile = await fetchProfile();
      setLocalUser(profile ?? null);
      return;
    } catch {
      setLocalUser(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (status === "loading") return;

      if (!sessionUser) {
        if (active) {
          setLocalUser(null);
          if (pathname !== "/login" && pathname !== "/cadastro") {
            router.replace("/login");
          }
        }
        return;
      }

      try {
        const profile = await fetchProfile();

        if (!active) return;

        if (!profile) {
          // fallback com valores válidos para satisfazer o tipo TypesLocalUser
          setLocalUser({
            id: undefined as any,
            nome: sessionUser.name ?? undefined,
            email: sessionUser.email ?? undefined,
            empresa_id: sessionUser.empresa_id ?? undefined,
            nome_empresa: sessionUser.name ?? "Empresa",
            // fornece um nivel_acesso válido por padrão
            nivel_acesso: "viewer",
            // plano padrão válido
            plano: "gratis",
            permissoes: [],
            features: [],
            foto: undefined,
            role: sessionUser.role ?? undefined,
          } as TypesLocalUser);
          return;
        }

        setLocalUser(profile as TypesLocalUser);

        if (!profile?.empresa_id && pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        if (active) {
          // fallback com valores válidos para satisfazer o tipo TypesLocalUser
          setLocalUser({
            id: undefined as any,
            nome: sessionUser?.name ?? undefined,
            email: sessionUser?.email ?? undefined,
            empresa_id: sessionUser?.empresa_id ?? undefined,
            nome_empresa: sessionUser?.name ?? "Empresa",
            nivel_acesso: "viewer",
            plano: "gratis",
            permissoes: [],
            features: [],
            foto: undefined,
            role: sessionUser?.role ?? undefined,
          } as TypesLocalUser);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
     
  }, [sessionUser, status, pathname, router]);

  async function handleSignOut() {
    setLocalUser(null);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      // ignore
    }
  }

  function hasRole(role: string) {
    if (!localUser) return false;
    const nivel = (localUser as any).nivel_acesso as string | undefined;
    const r = (localUser as any).role as string | undefined;
    return nivel === role || r === role;
  }

  const isSuperAdmin = Boolean((localUser as any)?.isSuperAdmin || (localUser as any)?.role === "superadmin");

  const value = useMemo<AppAuthContextValue>(
    () => ({
      localUser: localUser ?? null,
      isLoading: isLoading,
      hasRole,
      isSuperAdmin,
      refresh,
      signOut: handleSignOut,
    }),
    [localUser, isLoading],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}
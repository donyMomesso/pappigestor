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

type SessionUserExtra = {
  name?: string | null;
  email?: string | null;
  empresa_id?: string;
  role?: string;
};

type LocalUser = {
  id?: string;
  email?: string;
  nome?: string;
  empresa_id?: string;
  role?: string;
};

type AppAuthContextValue = {
  user: LocalUser | null;
  localUser: LocalUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const isLoading = status === "loading";
  const sessionUser = (session?.user ?? null) as SessionUserExtra | null;

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
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!active) return;

        if (!res.ok) {
          setLocalUser({
            nome: sessionUser.name ?? undefined,
            email: sessionUser.email ?? undefined,
            empresa_id: sessionUser.empresa_id,
            role: sessionUser.role,
          });
          return;
        }

        const profile = (await res.json()) as LocalUser;

        if (!active) return;
        setLocalUser(profile);

        if (!profile?.empresa_id && pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);

        if (active) {
          setLocalUser({
            nome: sessionUser.name ?? undefined,
            email: sessionUser.email ?? undefined,
            empresa_id: sessionUser.empresa_id,
            role: sessionUser.role,
          });
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
    await signOut({ callbackUrl: "/login" });
  }

  const value = useMemo<AppAuthContextValue>(
    () => ({
      user: sessionUser
        ? {
            nome: sessionUser.name ?? undefined,
            email: sessionUser.email ?? undefined,
            empresa_id: sessionUser.empresa_id,
            role: sessionUser.role,
          }
        : null,
      localUser,
      isLoading,
      signOut: handleSignOut,
    }),
    [sessionUser, localUser, isLoading],
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
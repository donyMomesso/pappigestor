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

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (status === "loading") return;

      if (!session?.user) {
        setLocalUser(null);

        if (pathname !== "/login" && pathname !== "/cadastro") {
          router.replace("/login");
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });

        if (!active) return;

        if (!res.ok) {
          setLocalUser({
            email: session.user.email ?? undefined,
            empresa_id:
              "empresa_id" in session.user && typeof session.user.empresa_id === "string"
                ? session.user.empresa_id
                : undefined,
            role:
              "role" in session.user && typeof session.user.role === "string"
                ? session.user.role
                : undefined,
          });
          return;
        }

        const profile = (await res.json()) as LocalUser;
        setLocalUser(profile);

        if (!profile?.empresa_id && pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        if (active) {
          setLocalUser(null);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [session, status, pathname, router]);

  async function handleSignOut() {
    setLocalUser(null);
    await signOut({ callbackUrl: "/login" });
  }

  const value = useMemo(
    () => ({
      user: session?.user
        ? {
            email: session.user.email ?? undefined,
            empresa_id:
              "empresa_id" in session.user && typeof session.user.empresa_id === "string"
                ? session.user.empresa_id
                : undefined,
            role:
              "role" in session.user && typeof session.user.role === "string"
                ? session.user.role
                : undefined,
          }
        : null,
      localUser,
      isLoading,
      signOut: handleSignOut,
    }),
    [session, localUser, isLoading],
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
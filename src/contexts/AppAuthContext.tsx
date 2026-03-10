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
import { getSupabaseClient } from "@/lib/supabaseClient";

// Alterado de 'loading' para 'isLoading' para bater com o Layout
type AppAuthContextValue = {
  user: any;
  localUser: any;
  isLoading: boolean; 
  signOut: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);
  // Alterado para isLoading para manter o padrão
  const [isLoading, setIsLoading] = useState(true); 

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (active) {
          setIsLoading(false);
          router.replace("/login");
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (active) {
            setUser(null);
            setLocalUser(null);
            // Evita redirecionar se já estiver na tela de login ou cadastro
            if (pathname !== "/login" && pathname !== "/cadastro") {
                router.replace("/login");
            }
          }
          return;
        }

        if (!active) return;
        setUser(session.user);

        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!active) return;

        if (!res.ok) {
          setLocalUser(null);
          setIsLoading(false);
          return;
        }

        const profile = await res.json();
        setLocalUser(profile);

        if (!profile?.empresa_id && pathname !== "/onboarding") {
          router.replace("/onboarding");
          return;
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        if (active) {
          setUser(null);
          setLocalUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => { active = false; };
  }, [pathname, router]);

  async function signOut() {
    const supabase = getSupabaseClient();
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      setUser(null);
      setLocalUser(null);
      router.replace("/login");
    }
  }

  const value = useMemo(
    () => ({
      user,
      localUser,
      isLoading, // Nome correto para o sistema
      signOut,
    }),
    [user, localUser, isLoading]
  );

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  }
  return ctx;
}

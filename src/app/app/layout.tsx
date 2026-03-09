"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

// 1. Definição do Contexto
interface AuthContextType {
  user: any;
  localUser: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provedor de Autenticação e Layout Protegido
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Inicializa o cliente
  const supabase = getSupabaseClient(); 

  useEffect(() => {
    async function checkAuth() {
      // ✅ Verificação de segurança para o TypeScript
      if (!supabase) {
        console.error("Supabase client não pôde ser inicializado.");
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push("/login");
          return;
        }

        setUser(session.user);

        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        
        if (res.ok) {
          const profile = await res.json();
          setLocalUser(profile);
          
          if (!profile.empresa_id && pathname !== "/app/onboarding") {
            router.push("/app/onboarding");
          }
        }
      } catch (error) {
        console.error("Erro na auth:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router, supabase]);

  const signOut = async () => {
    // ✅ Verificação de segurança para o TypeScript
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Se o supabase for null após o loading, mostra um erro amigável
  if (!supabase) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-red-500 font-bold">
        Erro: Configuração do Supabase ausente.
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, localUser, loading, signOut }}>
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}

// 3. Hooks para os outros arquivos usarem
export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  return context;
}

export function useAppAuthOptional() {
  return useContext(AuthContext);
}

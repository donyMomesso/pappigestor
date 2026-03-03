"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";

// Evita que o build quebre caso as variáveis de ambiente demorem a carregar na Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Interface atualizada aceitando o modelo antigo e o novo do Supabase
export type LocalUser = {
  id: string;
  name?: string; // Mantido para não quebrar a UI
  nome?: string; // Vindo do Supabase
  role?: string;
  nivel_acesso?: string; // Vindo do Supabase
  email?: string;
  nome_empresa?: string;
  empresa_id?: string; // Vindo do Supabase
};

// 2. Tipagem do Contexto (Mantive o setLocalUser para não quebrar as telas de Login/Cadastro)
type AuthContextType = {
  localUser: LocalUser | null;
  setLocalUser: (u: LocalUser | null) => void; 
  loading: boolean;
  logout: () => Promise<void>;
};

const AppAuthContext = createContext<AuthContextType | undefined>(undefined);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLocalUser(null);
          setLoading(false);
          return;
        }

        // Busca os dados do perfil na tabela do Supabase
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // 3. Atualiza o usuário garantindo compatibilidade com o sistema
        setLocalUser({
          id: user.id,
          name: profile?.nome || user.email || "Usuário", // Fallback visual
          nome: profile?.nome,
          email: user.email,
          empresa_id: profile?.empresa_id,
          nivel_acesso: profile?.nivel_acesso,
          role: profile?.nivel_acesso || "admin", // Fallback visual
          nome_empresa: profile?.nome_empresa,
        });

      } catch (error) {
        console.error("Erro ao carregar usuário do Supabase:", error);
        setLocalUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setLocalUser(null);
    window.location.href = "/login";
  };

  const value = useMemo(
    () => ({ localUser, setLocalUser, loading, logout }),
    [localUser, loading]
  );

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error("useAppAuth deve ser usado dentro de um AppAuthProvider");
  }
  return context;
}
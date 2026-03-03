"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          console.error("Configuração de ambiente faltando.");
          setIsLoading(false);
          return;
        }

        const { data: sess, error: sessErr } = await supabase.auth.getSession();
        if (sessErr || !sess.session) {
          setIsLoading(false);
          return;
        }

        // Verifica o acesso do usuário silenciosamente
        await supabase
          .from("company_users")
          .select("company_id, role")
          .eq("user_id", sess.session.user.id)
          .limit(1)
          .maybeSingle();

      } catch (e) {
        console.error("Erro na inicialização do Shell:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Se ainda estiver carregando a sessão, podemos mostrar um estado vazio ou um spinner discreto
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}
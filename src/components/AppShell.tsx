"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseClient();

        // Se não tem env/config, não trava o app (deixa seguir)
        if (!supabase) {
          console.error("Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
          return;
        }

        const { data: sess, error: sessErr } = await supabase.auth.getSession();
        if (sessErr || !sess.session) {
          return;
        }

        // Verifica o acesso do usuário silenciosamente (não precisa salvar nada aqui)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return <>{children}</>;
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  plano?: string;
  status?: string;
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Validando credenciais...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setError(null);
        setStatus("Validando credenciais...");

        // 0) Supabase (modo offline-safe)
        const supabase = getSupabaseClient();
        if (!supabase) {
          setError("Supabase não configurado. Configure as variáveis de ambiente para ativar o login.");
          setTimeout(() => router.push("/login"), 1200);
          return;
        }

        // 1) Sessão do Supabase (code -> session)
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const session = data.session;
        if (!session?.user?.email) {
          router.push("/login");
          return;
        }

        const email = session.user.email.toLowerCase();

        // salva email (usado por outras telas)
        localStorage.setItem("user_email", email);

        setStatus("Carregando suas empresas...");

        // 2) Descobrir empresas do usuário
        const res = await fetch("/api/empresas/minhas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("Erro /api/empresas/minhas:", res.status, txt);

          setError("Não consegui carregar suas empresas. Tente novamente.");
          setTimeout(() => router.push("/login"), 2500);
          return;
        }

        const payload = (await res.json().catch(() => null)) as { empresas?: Empresa[] } | null;
        const empresas = Array.isArray(payload?.empresas) ? payload!.empresas : [];

        // 3) Regras de roteamento (SaaS multi-tenant)
        if (empresas.length === 0) {
          setStatus("Nenhuma empresa encontrada. Vamos criar/ativar sua empresa...");

          setTimeout(() => {
            router.push("/app/onboarding");
            router.refresh();
          }, 900);
          return;
        }

        if (empresas.length === 1) {
          const emp = empresas[0];

          localStorage.setItem("empresa_id", emp.id);
          localStorage.removeItem("pId"); // legado

          setStatus(`Entrando em ${emp.nome}...`);

          setTimeout(() => {
            router.push("/app/dashboard");
            router.refresh();
          }, 700);
          return;
        }

        // Mais de uma empresa -> seleção
        setStatus("Escolha a empresa para entrar...");

        localStorage.removeItem("pId");
        localStorage.removeItem("empresa_id");

        setTimeout(() => {
          router.push("/app/empresas");
          router.refresh();
        }, 700);
      } catch (err: any) {
        console.error("Erro crítico no callback:", err);
        setError(err?.message || "Falha na autenticação. Tente novamente.");
        setTimeout(() => router.push("/login"), 2500);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative p-5 bg-gray-900 border border-white/5 rounded-[30px]">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-white font-black italic uppercase tracking-tighter text-2xl">
            {error ? "Ops!" : status}
          </p>
          <p className="text-gray-500 font-bold italic uppercase text-[10px] tracking-[0.3em]">
            {error ? error : "Pappi Gestor v2.0"}
          </p>
        </div>
      </div>
    </div>
  );
}
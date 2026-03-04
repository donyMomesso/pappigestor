"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // USAR NEXT/NAVIGATION NO LUGAR DE REACT-ROUTER
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Validando credenciais...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // O Supabase processa o 'code' da URL automaticamente aqui
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) throw authError;

        if (data.session) {
          setStatus("Sessão ativa! Entrando no sistema...");
          
          // Pequeno delay para garantir que o cookie de sessão 'assente' no navegador
          setTimeout(() => {
            router.push("/app/dashboard");
            router.refresh(); // Força o Next.js a revalidar o Middleware
          }, 1200);
        } else {
          // Se não houver sessão, volta pro login
          router.push("/login");
        }
      } catch (err: any) {
        console.error("Erro crítico no callback:", err);
        setError("Falha na autenticação. Tente novamente.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-8">
        {/* Loader Mocha Style */}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  Loader2,
  CheckCircle2,
  Building2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  plano?: string;
  status?: string;
};

type Stage = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();

  const [status, setStatus] = useState("Validando seu acesso...");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [progressStep, setProgressStep] = useState(0);

  const progressItems = useMemo(
    () => [
      "Validando sua autenticação",
      "Carregando suas empresas",
      "Preparando sua entrada",
    ],
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const setSafeStatus = (value: string) => {
      if (isMounted) setStatus(value);
    };

    const setSafeError = (value: string | null) => {
      if (isMounted) setError(value);
    };

    const setSafeStage = (value: Stage) => {
      if (isMounted) setStage(value);
    };

    const setSafeProgressStep = (value: number) => {
      if (isMounted) setProgressStep(value);
    };

    const goTo = (path: string, delay = 900) => {
      window.setTimeout(() => {
        router.push(path);
        router.refresh();
      }, delay);
    };

    const handleAuth = async () => {
      try {
        setSafeError(null);
        setSafeStage("loading");
        setSafeProgressStep(0);
        setSafeStatus("Validando seu acesso...");

        const supabase = getSupabaseClient();

        if (!supabase) {
          setSafeStage("error");
          setSafeError(
            "Supabase não configurado. Configure as variáveis de ambiente para ativar o login.",
          );
          goTo("/login", 1800);
          return;
        }

        setSafeProgressStep(1);

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const session = data.session;

        if (!session?.user?.email) {
          setSafeStage("error");
          setSafeError("Não foi possível validar sua sessão. Faça login novamente.");
          goTo("/login", 1800);
          return;
        }

        const email = session.user.email.toLowerCase().trim();

        localStorage.setItem("user_email", email);

        setSafeStatus("Carregando sua estrutura...");
        setSafeProgressStep(2);

        const res = await fetch("/api/empresas/minhas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("Erro /api/empresas/minhas:", res.status, txt);

          setSafeStage("error");
          setSafeError("Não consegui carregar suas empresas. Tente novamente.");
          goTo("/login", 2200);
          return;
        }

        const payload = (await res.json().catch(() => null)) as
          | { empresas?: Empresa[] }
          | null;

        const empresas = Array.isArray(payload?.empresas) ? payload.empresas : [];

        setSafeProgressStep(3);

        if (empresas.length === 0) {
          localStorage.removeItem("empresa_id");
          localStorage.removeItem("pId");

          setSafeStage("success");
          setSafeStatus("Vamos preparar seu ambiente inicial...");
          goTo("/app/onboarding", 1100);
          return;
        }

        if (empresas.length === 1) {
          const empresa = empresas[0];

          localStorage.setItem("empresa_id", empresa.id);
          localStorage.removeItem("pId");

          setSafeStage("success");
          setSafeStatus(`Entrando em ${empresa.nome}...`);
          goTo("/app/dashboard", 900);
          return;
        }

        localStorage.removeItem("pId");
        localStorage.removeItem("empresa_id");

        setSafeStage("success");
        setSafeStatus("Encontramos mais de uma empresa. Vamos escolher a certa.");
        goTo("/app/empresas", 1000);
      } catch (err: any) {
        console.error("Erro crítico no callback:", err);

        setSafeStage("error");
        setSafeError(err?.message || "Falha na autenticação. Tente novamente.");
        goTo("/login", 2200);
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-[40px] border border-gray-100 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 px-6 py-8 sm:px-8 sm:py-10 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/10 backdrop-blur-xl border border-white/20">
                {stage === "loading" && (
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                )}
                {stage === "success" && (
                  <CheckCircle2 className="w-8 h-8 text-white" />
                )}
                {stage === "error" && (
                  <AlertCircle className="w-8 h-8 text-white" />
                )}
              </div>

              <div>
                <p className="text-[11px] font-black italic uppercase tracking-[0.24em] text-orange-100">
                  pappi gestor
                </p>
                <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none mt-1">
                  {stage === "error"
                    ? "Algo saiu do esperado"
                    : stage === "success"
                      ? "Sua entrada está pronta"
                      : "Estamos preparando sua entrada"}
                </h1>
              </div>
            </div>

            <div className="absolute -right-8 -bottom-10 text-[180px] font-black italic text-white/5 leading-none select-none pointer-events-none">
              P
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="space-y-6">
              <div className="space-y-3 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-600 px-4 py-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-black italic uppercase tracking-[0.22em]">
                    entrada inteligente
                  </span>
                </div>

                <p className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-gray-900">
                  {error ? "Ops!" : status}
                </p>

                <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                  {error
                    ? error
                    : "Estamos validando sua conta e organizando o melhor caminho para você entrar no sistema."}
                </p>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-5 sm:p-6">
                <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-gray-500 mb-4">
                  progresso da entrada
                </p>

                <div className="space-y-4">
                  {progressItems.map((item, index) => {
                    const itemStep = index + 1;
                    const isDone = progressStep > itemStep;
                    const isCurrent = progressStep === itemStep;

                    return (
                      <div key={item} className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                            isDone
                              ? "bg-green-50 border-green-100 text-green-600"
                              : isCurrent
                                ? "bg-orange-50 border-orange-100 text-orange-600"
                                : "bg-white border-gray-200 text-gray-300"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isDone || isCurrent ? "text-gray-800" : "text-gray-400"
                            }`}
                          >
                            {item}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {isDone
                              ? "Concluído"
                              : isCurrent
                                ? "Em andamento"
                                : "Aguardando"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!error && (
                <div className="rounded-[24px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                  <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-orange-600 mb-2">
                    o que estamos fazendo agora
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    O Pappi Gestor está verificando sua autenticação, identificando sua
                    empresa e definindo o melhor ponto de entrada para você.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-[24px] border border-red-100 bg-red-50 p-5">
                  <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-red-600 mb-2">
                    não foi possível concluir
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Vamos te levar de volta para a tela de login para tentar novamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
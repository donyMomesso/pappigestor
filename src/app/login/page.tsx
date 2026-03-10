"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Store,
  BarChart3,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const supabase = getSupabaseClient();

        if (!supabase) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (active && session?.user) {
          router.replace("/app");
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  const highlights = useMemo(
    () => [
      {
        icon: <Bot className="h-5 w-5" />,
        title: "IA aplicada à operação",
        description:
          "Leitura de documentos, apoio operacional e decisões mais rápidas no dia a dia.",
      },
      {
        icon: <Store className="h-5 w-5" />,
        title: "Feito para food service",
        description:
          "Pizzaria, restaurante, hamburgueria e rotinas reais de operação.",
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: "Gestão conectada",
        description:
          "Estoque, compras e financeiro trabalhando juntos em uma visão única.",
      },
    ],
    []
  );

  const trustItems = useMemo(
    () => [
      "Acesso rápido com Google",
      "Ambiente isolado por empresa",
      "Entrada guiada no primeiro acesso",
    ],
    []
  );

  const handleLogin = async () => {
    try {
      setIsLoading(true);

      const supabase = getSupabaseClient();

      if (!supabase) {
        console.error("Supabase não configurado (ENV ausente).");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Erro ao iniciar login:", error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro inesperado ao iniciar login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#111827] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,88,12,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.18),transparent_28%)]" />
          <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between px-8 py-8 md:px-12 md:py-10 xl:px-16 xl:py-12">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                  <Sparkles className="h-7 w-7 text-orange-300" />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange-300/90">
                    Pappi Gestor
                  </p>
                  <p className="text-lg font-black tracking-tight text-white">
                    ERP para Food Service
                  </p>
                </div>
              </Link>
            </div>

            <div className="max-w-3xl py-12 md:py-16 xl:py-20">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-orange-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/90">
                  inteligência operacional ativa
                </span>
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-6xl xl:text-7xl">
                Controle a operação.
                <br />
                <span className="text-orange-400">Decida melhor.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-200 md:text-lg">
                O Pappi Gestor conecta estoque, compras, financeiro e
                inteligência para transformar rotina em clareza, margem e
                crescimento.
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-1 xl:max-w-2xl">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-white/10 bg-white/8 px-5 py-5 backdrop-blur-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-orange-300">
                        {item.icon}
                      </div>

                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.08em] text-white md:text-[15px]">
                          {item.title}
                        </p>
                        <p className="mt-1.5 text-sm leading-7 text-zinc-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                feito para quem quer controle, clareza e lucro
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-y-auto bg-[#fffaf7] px-6 py-10 md:px-10 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.06),transparent_30%)]" />

          <div className="relative z-10 w-full max-w-xl">
            <div className="rounded-[36px] border border-orange-100/60 bg-white/92 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-orange-600">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em]">
                    entrada inteligente
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl font-black tracking-tight text-zinc-950 md:text-5xl">
                    Bem-vindo de volta
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-500 md:text-base">
                    Entre no seu centro de inteligência e continue a evolução da
                    sua operação com uma visão mais clara do negócio.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="group h-16 w-full rounded-[24px] bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 px-6 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_20px_40px_rgba(234,88,12,0.28)] transition-all hover:scale-[1.01] hover:opacity-95 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <img
                        src="https://www.google.com/favicon.ico"
                        className="h-5 w-5"
                        alt="Google"
                      />
                      Entrar com Google
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <div className="rounded-[28px] border border-zinc-100 bg-zinc-50/80 p-5">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                    o que você encontra ao entrar
                  </p>

                  <div className="space-y-3">
                    {trustItems.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-600">
                    novo por aqui?
                  </p>
                  <p className="mb-4 text-sm leading-7 text-zinc-700">
                    Crie sua conta e monte seu ambiente para começar com a base
                    certa, sem perder tempo.
                  </p>

                  <Link href="/cadastro" className="block">
                    <Button className="h-14 w-full rounded-[22px] bg-white text-sm font-black uppercase tracking-[0.14em] text-orange-700 shadow-sm ring-1 ring-orange-200 hover:bg-orange-50">
                      Criar conta grátis
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4 rounded-[28px] border border-zinc-100 bg-white/80 p-5 shadow-sm">
              <div className="rounded-2xl bg-green-50 p-3 text-green-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-zinc-900">
                  Ambiente seguro e isolado
                </p>
                <p className="mt-1.5 text-[13px] leading-6 text-zinc-500">
                  Seus dados e os dados da sua operação ficam protegidos com
                  autenticação segura e separação por empresa.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";
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

import { apiClient } from "@/lib/apiClient";

async function carregarDados() {
  try {
    const dados = await apiClient("/api/produtos");
    console.log(dados);
  } catch (err) {
    console.error(err);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const empresaId = localStorage.getItem("empresa_id");
    if (empresaId) {
      router.push("/app/dashboard");
    }
  }, [router]);

  const highlights = useMemo(
    () => [
      {
        icon: <Bot className="w-5 h-5" />,
        title: "IA aplicada ao food service",
        description:
          "Leitura de notas, apoio operacional e decisões mais rápidas.",
      },
      {
        icon: <Store className="w-5 h-5" />,
        title: "Feito para operação real",
        description:
          "Pizzaria, restaurante, hamburgueria e rotinas do dia a dia.",
      },
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Gestão que vira lucro",
        description:
          "Estoque, compras e financeiro conectados em uma só visão.",
      },
    ],
    [],
  );

  const trustItems = useMemo(
    () => [
      "Entrada rápida com Google",
      "Ambiente seguro por empresa",
      "Experiência guiada no primeiro acesso",
    ],
    [],
  );

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/app/dashboard" });
    } catch (error) {
      console.error("Erro inesperado ao iniciar login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* SEÇÃO BRANDING */}
      <section className="flex-1 bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-[22px] border border-white/20 shadow-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-black italic uppercase tracking-tighter">
              Pappi Gestor
            </span>
          </Link>
        </div>

        <div className="relative z-10 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl shadow-lg mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-black italic uppercase tracking-[0.28em]">
              inteligência operacional ativa
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl max-w-4xl">
            ENTRE E FAÇA SEU NEGÓCIO PENSAR MELHOR.
          </h1>

          <p className="text-orange-50 text-base md:text-xl font-bold max-w-2xl leading-relaxed">
            O Pappi Gestor conecta estoque, compras, financeiro e inteligência
            para transformar rotina em decisão.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 max-w-2xl">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-white/15 bg-white/10 backdrop-blur-xl px-5 py-4 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 border border-white/15">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-black italic uppercase tracking-tight">
                      {item.title}
                    </p>
                    <p className="text-sm text-orange-50/90 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-orange-100/90">
            feito para quem quer controle, clareza e lucro
          </p>
        </div>

        <div className="absolute -right-20 -bottom-20 text-[500px] font-black italic text-white/5 leading-none uppercase select-none pointer-events-none">
          P
        </div>
      </section>

      {/* SEÇÃO LOGIN */}
      <section className="w-full md:w-[680px] p-8 md:p-16 flex flex-col justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-xl mx-auto space-y-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-600 px-4 py-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-black italic uppercase tracking-[0.24em]">
                entrada inteligente
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
              Bem-vindo de volta
            </h2>

            <p className="text-gray-700 font-medium text-base leading-relaxed max-w-lg">
              Entre no seu centro de inteligência e continue a evolução da sua
              operação.
            </p>
          </div>

          <div className="rounded-[36px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6 md:p-8 space-y-6">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className={`w-full h-16 md:h-20 rounded-[26px] flex items-center justify-center gap-4 font-black italic uppercase text-xs tracking-[0.18em] transition-all shadow-lg shadow-gray-100 group disabled:opacity-70
                ${
                  isLoading
                    ? "bg-orange-50 border-orange-200 text-orange-600"
                    : "bg-white border-2 border-gray-100 text-gray-800 hover:border-orange-500 hover:bg-orange-50"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  Conectando...
                </>
              ) : (
                <>
                  <Image
                    src="/google-icon.png"
                    width={20}
                    height={20}
                    alt="Google"
                  />
                  Entrar com Google
                  <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </Button>

            <div className="rounded-[28px] bg-gray-50 border border-gray-100 p-5">
              <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-gray-500 mb-4">
                o que você encontra ao entrar
              </p>
              <div className="space-y-3">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

                        <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
              <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-orange-600 mb-2">
                novo por aqui?
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Crie sua conta e monte seu ambiente para começar com a base
                certa.
              </p>

              <Link href="/cadastro" className="block">
                <Button className="w-full h-14 rounded-[22px] bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 text-white font-black italic uppercase tracking-[0.16em] hover:opacity-95 shadow-lg">
                  Criar conta grátis
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-2 flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="text-xs font-black italic uppercase text-gray-900 tracking-tight">
                Ambiente seguro e isolado
              </p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-md">
                Seus dados e os dados dos seus clientes ficam protegidos com
                isolamento por empresa e autenticação segura.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
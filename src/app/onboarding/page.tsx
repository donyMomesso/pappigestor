"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import {
  Building2,
  Loader2,
  ArrowRight,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Store,
  Bot,
  BarChart3,
} from "lucide-react";

type BrasilApiCnpjResponse = {
  razao_social?: string;
  nome_fantasia?: string;
};

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cnpj, setCnpj] = useState("");
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const benefits = useMemo(
    () => [
      {
        icon: <Store className="w-5 h-5" />,
        title: "Estrutura inicial organizada",
        description:
          "Seu ambiente começa com a base certa para operação real de food service.",
      },
      {
        icon: <Bot className="w-5 h-5" />,
        title: "IA pronta para evoluir com você",
        description:
          "Depois da entrada, o sistema pode começar a apoiar compras, estoque e rotina.",
      },
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Mais clareza desde o começo",
        description:
          "Você entra entendendo melhor a operação e pronto para crescer com mais controle.",
      },
    ],
    [],
  );

  const nextSteps = useMemo(
    () => [
      "Validamos o CNPJ da empresa",
      "Criamos sua estrutura inicial",
      "Vinculamos você como responsável principal",
      "Liberamos sua entrada no dashboard",
    ],
    [],
  );

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setMsg("Supabase não configurado. Configure as ENV na Vercel ou no ambiente local.");
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      const session = data.session;
      const empresaId = session.user.user_metadata?.empresa_id as string | undefined;

      if (empresaId) {
        localStorage.setItem("empresa_id", empresaId);
        router.replace("/app/dashboard");
        return;
      }

      setLoading(false);
    })();
  }, [router]);

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const buscarCnpj = async (cnpjDigitado: string) => {
    const formatted = formatCnpj(cnpjDigitado);
    const cnpjLimpo = formatted.replace(/\D/g, "");

    setCnpj(formatted);

    if (cnpjLimpo.length !== 14) {
      setRazaoSocial("");
      setNomeFantasia("");
      setMsg(null);
      return;
    }

    setIsFetchingCnpj(true);
    setMsg(null);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);

      if (!res.ok) {
        throw new Error("CNPJ inválido ou não encontrado.");
      }

      const data = (await res.json()) as BrasilApiCnpjResponse;

      const rz = (data.razao_social || "").trim();
      const nf = (data.nome_fantasia || data.razao_social || "").trim();

      if (!rz || !nf) {
        throw new Error("Não consegui localizar Razão Social e Nome Fantasia.");
      }

      setRazaoSocial(rz);
      setNomeFantasia(nf);
    } catch (err: any) {
      setMsg(err?.message || "Falha ao consultar CNPJ.");
      setRazaoSocial("");
      setNomeFantasia("");
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  async function criarEmpresa(e: React.FormEvent) {
    e.preventDefault();

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMsg("Supabase não configurado. Configure as ENV.");
      router.replace("/login");
      return;
    }

    if (!razaoSocial || !nomeFantasia) {
      setMsg("Primeiro informe um CNPJ válido para preparar sua empresa.");
      return;
    }

    setIsSubmitting(true);
    setMsg(null);

    const { data: sessData, error: sessErr } = await supabase.auth.getSession();
    const session = sessData?.session;

    if (sessErr || !session) {
      setMsg("Sessão expirada. Faça login novamente.");
      setIsSubmitting(false);
      router.replace("/login");
      return;
    }

    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert([
        {
          name: nomeFantasia.trim(),
          razao_social: razaoSocial,
          cnpj: cnpj.replace(/\D/g, ""),
          created_by: session.user.id,
        },
      ])
      .select("id")
      .single();

    if (companyErr || !company?.id) {
      setMsg("Erro no banco de dados: " + (companyErr?.message || "Falha ao criar empresa."));
      setIsSubmitting(false);
      return;
    }

    const { error: linkErr } = await supabase.from("company_users").insert([
      {
        company_id: company.id,
        user_id: session.user.id,
        role: "admin_empresa",
      },
    ]);

    if (linkErr) {
      setMsg("Erro ao vincular usuário: " + linkErr.message);
      setIsSubmitting(false);
      return;
    }

    const { error: updErr } = await supabase.auth.updateUser({
      data: {
        nome_empresa: nomeFantasia.trim(),
        empresa_id: company.id,
        plano: "grátis",
        nivel_acesso: "admin",
      },
    });

    if (updErr) {
      setMsg("Erro ao atualizar usuário: " + updErr.message);
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem("empresa_id", company.id);
    router.replace("/app/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[36px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-8 sm:p-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 border border-orange-100">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>

          <p className="text-[11px] font-black italic uppercase tracking-[0.24em] text-orange-600">
            preparando sua entrada
          </p>
          <h2 className="mt-3 text-3xl font-black italic uppercase tracking-tighter text-gray-900">
            Validando seu acesso
          </h2>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Estamos conferindo sua sessão para levar você ao ponto certo da jornada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* LADO ESQUERDO */}
      <section className="relative flex-1 bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 text-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16 overflow-hidden">
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-xl rounded-[22px] border border-white/20 shadow-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black italic uppercase tracking-tighter">
                Pappi Gestor
              </span>
            </Link>
          </div>

          <div className="py-10 lg:py-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl shadow-lg mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-black italic uppercase tracking-[0.28em]">
                primeira configuração
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.92] max-w-4xl">
              VAMOS MONTAR SUA BASE INTELIGENTE.
            </h1>

            <p className="mt-5 text-white/90 text-sm sm:text-base lg:text-xl font-medium max-w-2xl leading-relaxed">
              Informe o CNPJ da sua empresa e o Pappi Gestor prepara sua entrada com a
              estrutura inicial certa.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 max-w-2xl">
              {benefits.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-white/15 bg-white/10 backdrop-blur-xl px-5 py-4 shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 border border-white/15">
                      {item.icon}
                    </div>

                    <div>
                      <p className="text-sm sm:text-base font-black italic uppercase tracking-tight">
                        {item.title}
                      </p>
                      <p className="text-sm text-white/90 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-orange-100/90">
              feito para quem quer entrar e sentir valor logo no começo
            </p>
          </div>
        </div>

        <div className="absolute -right-20 -bottom-20 text-[420px] sm:text-[500px] font-black italic text-white/5 leading-none uppercase select-none pointer-events-none">
          P
        </div>
      </section>

      {/* LADO DIREITO */}
      <section className="w-full lg:w-[720px] bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-600 px-4 py-2">
              <Building2 className="w-4 h-4" />
              <span className="text-[11px] font-black italic uppercase tracking-[0.24em]">
                ativação da empresa
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
              Criar empresa inicial
            </h2>

            <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed max-w-lg">
              Esse passo ativa sua empresa dentro do sistema e prepara sua entrada no
              dashboard.
            </p>
          </div>

          <div className="rounded-[32px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-5 sm:p-7 space-y-6">
            <div className="rounded-[24px] bg-gray-50 border border-gray-100 p-4 sm:p-5">
              <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-gray-500 mb-4">
                o que acontece agora
              </p>

              <div className="space-y-3">
                {nextSteps.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={criarEmpresa} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black text-gray-500 ml-1 tracking-[0.16em]">
                  CNPJ da empresa
                </label>

                <div className="relative">
                  <Search
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                    size={20}
                  />

                  <Input
                    className="h-16 pl-14 pr-14 rounded-[24px] border-gray-200 bg-gray-50 font-black text-base sm:text-lg focus:bg-white transition-all tracking-widest text-gray-900"
                    value={cnpj}
                    onChange={(e) => buscarCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    required
                  />

                  {isFetchingCnpj && (
                    <Loader2
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500 animate-spin"
                      size={20}
                    />
                  )}
                </div>

                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  Ao informar um CNPJ válido, buscamos automaticamente os dados da empresa.
                </p>
              </div>

              {razaoSocial && (
                <div className="p-5 sm:p-6 bg-green-50 rounded-[28px] border border-green-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">
                      Dados localizados
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-green-700/60 font-black italic mb-1">
                      Razão social
                    </p>
                    <p className="font-bold text-sm text-green-950 opacity-90 uppercase leading-tight">
                      {razaoSocial}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-green-700/60 font-black italic mb-2">
                      Nome exibido no sistema
                    </p>

                    <Input
                      className="h-14 rounded-[20px] border-green-200 bg-white font-black uppercase tracking-tight text-gray-800"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                disabled={isSubmitting || !razaoSocial}
                className="w-full h-16 rounded-[24px] bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 text-white font-black italic uppercase text-xs tracking-[0.2em] shadow-xl hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Preparando sua entrada
                  </>
                ) : (
                  <>
                    Finalizar e entrar no sistema
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-1 flex items-start gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs font-black italic uppercase text-gray-900 tracking-tight">
                  Ativação segura
                </p>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  Sua empresa é criada e vinculada ao seu usuário principal para iniciar a
                  operação do jeito certo.
                </p>
              </div>
            </div>

            {msg && (
              <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-[11px] font-black uppercase tracking-[0.14em] text-center">
                  {msg}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
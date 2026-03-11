// src/app/cadastro/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Building2,
  User,
  CheckCircle,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Store,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

type TipoPessoa = "pj" | "pf";

interface FormData {
  tipo_pessoa: TipoPessoa;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  nome_responsavel: string;
  telefone: string;
  email: string;
  nome_empresa: string;
  responsavel_master: boolean;
}

export default function CadastroPage() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [formData, setFormData] = useState<FormData>({
    tipo_pessoa: "pj",
    razao_social: "",
    nome_fantasia: "",
    cnpj_cpf: "",
    nome_responsavel: "",
    telefone: "",
    email: "",
    nome_empresa: "",
    responsavel_master: true,
  });

  const [error, setError] = useState("");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const highlights = useMemo(
    () => [
      {
        icon: <Bot className="w-5 h-5" />,
        title: "IA para o dia a dia",
        description:
          "Comece com uma base pronta para compras, estoque e operação inteligente.",
      },
      {
        icon: <Store className="w-5 h-5" />,
        title: "Feito para food service",
        description:
          "Pizzaria, restaurante, hamburgueria e operação real em um só sistema.",
      },
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Mais clareza e lucro",
        description: "Organize a casa e transforme rotina em decisões melhores.",
      },
    ],
    [],
  );

  const onboardingBenefits = useMemo(
    () => [
      "Seu ambiente base começa a ser preparado",
      "Você entra com a estrutura mais organizada",
      "Depois o sistema guia os próximos passos",
    ],
    [],
  );

  const PLANS = useMemo(
    () => [
      {
        id: "start",
        title: "Pappi Start",
        priceLabel: "GRÁTIS",
        bullets: ["Gestão de Estoque Manual", "Cadastro de Insumos"],
      },
      {
        id: "pro",
        title: "Pappi Pro IA",
        priceLabel: "R$ 99 / mês",
        bullets: ["Assessor IA de Compras", "Scanner HD de Notas", "IA no WhatsApp"],
      },
      {
        id: "gestor",
        title: "Pappi Gestor",
        priceLabel: "R$ 49 / mês",
        bullets: ["Financeiro DDA", "Estoque em Tempo Real"],
      },
    ],
    [],
  );

  const formatCNPJ = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");

  const formatCPF = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  const formatTelefone = (value: string) => {
    const n = value.replace(/\D/g, "").slice(0, 11);

    return n.length <= 10
      ? n
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2")
      : n
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleDocChange = (value: string) => {
    const formatted =
      formData.tipo_pessoa === "pj" ? formatCNPJ(value) : formatCPF(value);

    setFormData((prev) => ({
      ...prev,
      cnpj_cpf: formatted,
    }));
  };

  // Busca CNPJ somente quando o usuário clicar no botão
  const buscarCnpj = async () => {
    const cnpjNumbers = formData.cnpj_cpf.replace(/\D/g, "");

    if (cnpjNumbers.length !== 14) {
      setError("CNPJ inválido");
      return;
    }

    setBuscandoCnpj(true);
    setError("");

    try {
      const res = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjNumbers}`,
      );

      if (!res.ok) {
        throw new Error("CNPJ não encontrado");
      }

      const data = await res.json();

      const razao = data?.razao_social || "";
      const fantasia = data?.nome_fantasia || data?.razao_social || "";

      setFormData((prev) => ({
        ...prev,
        razao_social: razao,
        nome_fantasia: fantasia,
        nome_empresa: fantasia || prev.nome_empresa,
      }));
    } catch (err: any) {
      setError(err?.message || "Erro ao buscar CNPJ");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const isEmailValido = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // salva dados temporários e mantém o usuário na página para ver apelo e planos
  const handleFinalize = async () => {
    setError("");

    const docNumbers = formData.cnpj_cpf.replace(/\D/g, "");

    if (!formData.nome_responsavel.trim()) {
      setError("Informe seu nome");
      return;
    }

    if (!formData.nome_fantasia.trim()) {
      setError("Informe o nome fantasia / apelido");
      return;
    }

    if (formData.tipo_pessoa === "pj" && docNumbers.length !== 14) {
      setError("CNPJ inválido");
      return;
    }

    if (formData.tipo_pessoa === "pf" && docNumbers.length !== 11) {
      setError("CPF inválido");
      return;
    }

    if (formData.email && !isEmailValido(formData.email)) {
      setError("Email inválido");
      return;
    }

    // salva dados temporariamente para uso posterior (planos / vinculação)
    try {
      sessionStorage.setItem("cadastroData", JSON.stringify(formData));
    } catch (e) {
      console.warn("sessionStorage unavailable", e);
    }

    setStep("processing");

    try {
      // pequena espera para UX
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStep("success");

      // usuário permanece na página; oferecemos CTA para trial ou login
    } catch (e: any) {
      setStep("form");
      setError(e?.message || "Erro ao finalizar cadastro");
    }
  };

  // ação rápida: começar grátis com trial do Pro (salva seleção e manda para login)
  const startFreeTrial = async () => {
    try {
      const payload = { cadastro: formData, plano: "pro", trialDays: 15 };
      sessionStorage.setItem("cadastroSelection", JSON.stringify(payload));
    } catch (e) {
      console.warn("sessionStorage write failed", e);
    }
    // redireciona para login (onde o usuário fará sign-in com Google)
    router.push("/app");
  };

  // apenas salva seleção informativa (não compra) e mantém na página
  const choosePlanInformational = (planId: string) => {
    setSelectedPlan(planId);
    try {
      const payload = { cadastro: formData, plano: planId };
      sessionStorage.setItem("cadastroSelection", JSON.stringify(payload));
    } catch (e) {
      console.warn("sessionStorage write failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT: apelo visual */}
      <section className="relative flex-1 bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 text-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16 overflow-hidden">
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-xl rounded-[22px] border border-white/20 shadow-2xl">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <span className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter">
                Pappi Gestor
              </span>
            </Link>
          </div>

          <div className="py-10 lg:py-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl shadow-lg mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-black italic uppercase tracking-[0.28em]">
                comece com a base certa
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-[0.92] max-w-4xl">
              MONTE SEU CENTRO DE INTELIGÊNCIA.
            </h1>

            <p className="mt-5 text-white/90 text-sm sm:text-base lg:text-lg font-medium max-w-2xl leading-relaxed">
              Crie sua conta agora — comece grátis e experimente o melhor do Pappi Pro
              por <strong>15 dias de trial</strong>. Sem compromisso: os planos ficam
              apenas para você conhecer; a cobrança e escolha final acontecem depois,
              dentro das configurações do painel.
            </p>

            <div className="mt-8 flex gap-3 items-center">
              <Button
                onClick={startFreeTrial}
                className="bg-white text-black font-black rounded-2xl px-6 py-3 shadow-lg"
              >
                Comece grátis — 15 dias de trial
              </Button>

              <Button
                variant="outline"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                className="rounded-2xl px-5 py-3 font-black"
              >
                Ver planos (só informação)
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 max-w-2xl">
              {highlights.map((item) => (
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

          <div className="space-y-3">
            <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-orange-100/90">
              feito para quem quer controle, clareza e crescimento
            </p>
          </div>
        </div>

        <div className="absolute -right-20 -bottom-20 text-[420px] sm:text-[500px] font-black italic text-white/5 leading-none uppercase select-none pointer-events-none">
          P
        </div>
      </section>

      {/* RIGHT: formulário + planos informativos */}
      <section className="w-full lg:w-[720px] bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          {step === "form" && (
            <div className="space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-600 px-4 py-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-black italic uppercase tracking-[0.24em]">
                    criação guiada
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                  Criar conta
                </h2>

                <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed max-w-lg">
                  Comece seu ambiente com o responsável principal da operação.
                  Depois você escolhe ou confirma o plano dentro do painel.
                </p>
              </div>

              <div className="rounded-[32px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-5 sm:p-7 space-y-6">
                <div className="rounded-[24px] bg-gray-50 border border-gray-100 p-4 sm:p-5">
                  <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-gray-500 mb-4">
                    o que acontece depois do cadastro
                  </p>

                  <div className="space-y-3">
                    {onboardingBenefits.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.tipo_pessoa === "pj" ? "default" : "outline"}
                    className={`h-14 rounded-[22px] font-black italic uppercase tracking-[0.16em] border ${
                      formData.tipo_pessoa === "pj"
                        ? "bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 text-white border-transparent hover:opacity-95"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo_pessoa: "pj",
                        cnpj_cpf: "",
                      }))
                    }
                  >
                    <Building2 className="mr-2 w-4 h-4" />
                    PJ
                  </Button>

                  <Button
                    type="button"
                    variant={formData.tipo_pessoa === "pf" ? "default" : "outline"}
                    className={`h-14 rounded-[22px] font-black italic uppercase tracking-[0.16em] border ${
                      formData.tipo_pessoa === "pf"
                        ? "bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 text-white border-transparent hover:opacity-95"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo_pessoa: "pf",
                        cnpj_cpf: "",
                      }))
                    }
                  >
                    <User className="mr-2 w-4 h-4" />
                    PF
                  </Button>
                </div>

                <div className="rounded-[24px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5">
                  <p className="text-[11px] font-black italic uppercase tracking-[0.22em] text-orange-600">
                    responsável master
                  </p>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    Este cadastro cria o perfil principal da conta. Depois você
                    poderá adicionar outras pessoas da equipe dentro do app.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="text-[11px] uppercase font-black text-gray-500 ml-1 tracking-[0.16em]">
                      Documento ({formData.tipo_pessoa === "pj" ? "CNPJ" : "CPF"})
                    </Label>

                    <div className="flex gap-2 mt-2">
                      <Input
                        className="bg-gray-50 border-gray-200 h-14 rounded-[22px] focus:border-orange-500 transition-all text-gray-900"
                        value={formData.cnpj_cpf}
                        onChange={(e) => handleDocChange(e.target.value)}
                        placeholder={
                          formData.tipo_pessoa === "pj"
                            ? "00.000.000/0000-00"
                            : "000.000.000-00"
                        }
                      />
                      {/* Busca só ao clicar */}
                      {formData.tipo_pessoa === "pj" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={buscarCnpj}
                          className="h-14 w-14 rounded-[22px] border-gray-200 bg-gray-50 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                          disabled={buscandoCnpj}
                          aria-disabled={buscandoCnpj}
                        >
                          {buscandoCnpj ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {formData.tipo_pessoa === "pj" && (
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                        Digite o CNPJ e use a busca para preencher mais rápido.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase font-black text-gray-500 ml-1 tracking-[0.16em]">
                      Nome fantasia / apelido do negócio
                    </Label>
                    <Input
                      className="bg-gray-50 border-gray-200 h-14 rounded-[22px] mt-2 text-gray-900"
                      value={formData.nome_fantasia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nome_fantasia: e.target.value,
                          nome_empresa: e.target.value,
                        }))
                      }
                      placeholder="Ex: Pappi Pizza Campinas"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase font-black text-gray-500 ml-1 tracking-[0.16em]">
                      Seu nome
                    </Label>
                    <Input
                      className="bg-gray-50 border-gray-200 h-14 rounded-[22px] mt-2 text-gray-900"
                      value={formData.nome_responsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nome_responsavel: e.target.value,
                        }))
                      }
                      placeholder="Ex: Donaldo Momesso"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase font-black text-gray-500 ml-1 tracking-[0.16em]">
                      Email do responsável (opcional)
                    </Label>
                    <Input
                      className="bg-gray-50 border-gray-200 h-14 rounded-[22px] mt-2 text-gray-900"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="voce@empresa.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase font-black text-gray-500 ml-1 tracking-[0.16em]">
                      Telefone (opcional)
                    </Label>
                    <Input
                      className="bg-gray-50 border-gray-200 h-14 rounded-[22px] mt-2 text-gray-900"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          telefone: formatTelefone(e.target.value),
                        }))
                      }
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-red-600 text-[11px] font-black uppercase tracking-[0.14em] text-center">
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleFinalize}
                  className="w-full h-16 rounded-[24px] bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 text-white text-sm font-black uppercase italic tracking-[0.16em] hover:opacity-95 shadow-lg"
                  disabled={step !== "form"}
                >
                  Criar ambiente inicial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <div className="pt-1 flex items-start gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-black italic uppercase text-gray-900 tracking-tight">
                      Cadastro seguro
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      Seus dados ficam protegidos e sua conta começa com o perfil
                      principal da operação.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                  Já tem conta?{" "}
                  <Link href="/app" className="font-black italic uppercase text-orange-600">
                    Entrar agora
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="rounded-[36px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-8 sm:p-10 min-h-[520px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              </div>

              <div className="space-y-4 max-w-md">
                <p className="text-[11px] font-black italic uppercase tracking-[0.24em] text-orange-600">
                  preparando sua entrada
                </p>

                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
                  Configurando seu ambiente
                </h2>

                <p className="text-gray-500 text-sm leading-relaxed">
                  Estamos organizando a base inicial para você entrar com mais
                  clareza e começar do jeito certo.
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-gray-100 bg-white shadow p-6 text-center">
                <div className="mb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Conta criada</h3>
                  <p className="text-gray-600">Seu ambiente inicial foi criado com sucesso.</p>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-3 font-semibold">Comece grátis agora</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={startFreeTrial} className="bg-gradient-to-r from-orange-600 via-orange-500 to-pink-600 text-white rounded-2xl px-5 py-3 font-black">
                      Comece grátis — 15 dias
                    </Button>

                    <Link href="/app" className="inline-flex items-center justify-center px-5 py-3 rounded-2xl border border-gray-200 font-black">
                      Entrar com Google
                    </Link>
                  </div>
                </div>
              </div>

              {/* Planos informativos (apenas para conhecimento) */}
              <div className="rounded-[24px] border border-gray-100 bg-white shadow p-6">
                <h4 className="font-black mb-4">Planos (apenas informativo)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((p) => (
                    <div key={p.id} className={`p-4 rounded-lg border ${selectedPlan === p.id ? "ring-2 ring-orange-400" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <strong>{p.title}</strong>
                        <span className="text-sm text-gray-600">{p.priceLabel}</span>
                      </div>
                      <ul className="text-sm text-gray-700 mb-3 space-y-1">
                        {p.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        <Button onClick={() => choosePlanInformational(p.id)} className="flex-1">
                          Selecionar (informativo)
                        </Button>
                        <Button onClick={() => { setSelectedPlan(p.id); startFreeTrial(); }} className="flex-1 bg-orange-600 text-white">
                          Testar 15 dias
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Os planos acima são apenas para você conhecer as opções. A cobrança e a confirmação final do plano acontecem dentro do painel, nas configurações, quando você estiver pronto.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
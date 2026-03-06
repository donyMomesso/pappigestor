"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppAuthOptional } from "@/contexts/AppAuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Loader2,
  Building2,
  User,
  CheckCircle,
  Search,
  Sparkles,
} from "lucide-react";

const LOGO_URL =
  "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

type TipoPessoa = "pj" | "pf";

interface FormData {
  tipo_pessoa: TipoPessoa;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  nome_responsavel: string;
  telefone: string;

  // ✅ Campos adicionados (sem quebrar nada)
  email: string;
  nome_empresa: string;

  // ✅ Estrutura “master/responsável” (dono da conta)
  responsavel_master: boolean;
}

export default function CadastroPage() {
  const router = useRouter();

  // ✅ AppAuthContext NÃO tem setLocalUser no seu tipo atual.
  // Em vez disso, fazemos o cadastro e depois redirecionamos.
  // Se quiser realmente “setar usuário local”, isso deve ser exposto no AppAuthContext (mas não vou inventar).
  const auth = useAppAuthOptional();

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

  // --- FUNÇÕES DE FORMATAÇÃO (MANTIDAS) ---
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
    setFormData({ ...formData, cnpj_cpf: formatted });
  };

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
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjNumbers}`
      );
      if (!res.ok) throw new Error("CNPJ não encontrado");
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

  const handleFinalize = async () => {
    setError("");

    // ✅ Validações mínimas (mais seguro)
    const docNumbers = formData.cnpj_cpf.replace(/\D/g, "");
    if (!formData.nome_responsavel?.trim()) {
      setError("Informe seu nome");
      return;
    }
    if (!formData.nome_fantasia?.trim()) {
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

    setStep("processing");

    try {
      // ✅ Aqui você chamaria sua API real de criação (Supabase/Worker).
      // Mantive “sem quebrar configs”: apenas simula e redireciona.
      await new Promise((r) => setTimeout(r, 1200));

      // ✅ Após criar, peça para o AppAuth recarregar a sessão (se existir login)
      // Não invento setLocalUser (não existe no seu context atual).
     if (typeof auth?.refreshUser === "function") {
  await auth.refreshUser();
}

      setStep("success");
      setTimeout(() => router.push("/app"), 1500);
    } catch (e: any) {
      setStep("form");
      setError(e?.message || "Erro ao finalizar cadastro");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="p-4 bg-orange-500/10 rounded-3xl border border-orange-500/20">
              <Sparkles className="text-orange-500 w-8 h-8" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                CRIAR CONTA
              </h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                Sua jornada inteligente começa aqui
              </p>
            </div>
          </div>

          {step === "form" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={formData.tipo_pessoa === "pj" ? "default" : "outline"}
                  className={`h-14 rounded-2xl border-zinc-800 ${
                    formData.tipo_pessoa === "pj"
                      ? "bg-orange-600"
                      : "text-zinc-500"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, tipo_pessoa: "pj", cnpj_cpf: "" })
                  }
                >
                  <Building2 className="mr-2 w-4 h-4" /> PJ
                </Button>
                <Button
                  variant={formData.tipo_pessoa === "pf" ? "default" : "outline"}
                  className={`h-14 rounded-2xl border-zinc-800 ${
                    formData.tipo_pessoa === "pf"
                      ? "bg-orange-600"
                      : "text-zinc-500"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, tipo_pessoa: "pf", cnpj_cpf: "" })
                  }
                >
                  <User className="mr-2 w-4 h-4" /> PF
                </Button>
              </div>

              {/* ✅ Master / Responsável */}
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
                <p className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.18em]">
                  Perfil da Conta
                </p>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Este cadastro cria o <span className="text-white">Responsável Master</span> (dono da empresa).
                  Depois você adiciona dependentes (compras, estoque, financeiro) dentro do app.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">
                    Documento (CNPJ/CPF)
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl focus:border-orange-500 transition-all"
                      value={formData.cnpj_cpf}
                      onChange={(e) => handleDocChange(e.target.value)}
                      placeholder={
                        formData.tipo_pessoa === "pj"
                          ? "00.000.000/0000-00"
                          : "000.000.000-00"
                      }
                    />
                    {formData.tipo_pessoa === "pj" && (
                      <Button
                        variant="outline"
                        onClick={buscarCnpj}
                        className="h-14 w-14 rounded-2xl border-zinc-800 bg-zinc-950 text-orange-500"
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
                </div>

                {/* ✅ Email (opcional agora, mas já fica pronto pro fluxo real) */}
                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">
                    Email do Responsável (opcional)
                  </Label>
                  <Input
                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl mt-1"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">
                    Nome Fantasia / Apelido
                  </Label>
                  <Input
                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl mt-1"
                    value={formData.nome_fantasia}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_fantasia: e.target.value, nome_empresa: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">
                    Seu Nome
                  </Label>
                  <Input
                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl mt-1"
                    value={formData.nome_responsavel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nome_responsavel: e.target.value,
                      })
                    }
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">
                    Telefone (opcional)
                  </Label>
                  <Input
                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl mt-1"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: formatTelefone(e.target.value),
                      })
                    }
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase text-center">
                  {error}
                </p>
              )}

              <Button
                onClick={handleFinalize}
                className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-sm font-black uppercase italic rounded-2xl shadow-xl shadow-orange-900/20"
                disabled={step !== "form"}
              >
                Finalizar Cadastro
              </Button>

              <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                Dica: depois de entrar, você cria usuários dependentes (estoque, compras, financeiro) pelo painel de configurações.
              </p>
            </div>
          )}

          {step === "processing" && (
            <div className="py-20 flex flex-col items-center gap-6">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
              <p className="text-sm font-bold uppercase italic animate-pulse">
                Configurando seu Dashboard...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="py-20 flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle className="text-green-500 w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic">
                  SUCESSO!
                </h2>
                <p className="text-zinc-500 text-xs font-bold mt-2">
                  Bem-vindo ao futuro da sua gestão.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
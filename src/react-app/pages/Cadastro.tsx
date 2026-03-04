"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "../contexts/AppAuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Loader2, Building2, User, ArrowLeft, 
  CheckCircle, Search, Sparkles 
} from "lucide-react";

const LOGO_URL = "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

type TipoPessoa = "pj" | "pf";

interface FormData {
  tipo_pessoa: TipoPessoa;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  nome_responsavel: string;
  telefone: string;
}

export default function CadastroPage() {
  const { setLocalUser } = useAppAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [formData, setFormData] = useState<FormData>({
    tipo_pessoa: "pj",
    razao_social: "",
    nome_fantasia: "",
    cnpj_cpf: "",
    nome_responsavel: "",
    telefone: "",
  });
  const [error, setError] = useState("");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  // --- FUNÇÕES DE FORMATAÇÃO (MANTIDAS) ---
  const formatCNPJ = (value: string) => value.replace(/\D/g, "").slice(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  const formatCPF = (value: string) => value.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  const formatTelefone = (value: string) => {
    const n = value.replace(/\D/g, "").slice(0, 11);
    return n.length <= 10 ? n.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2") : n.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleDocChange = (value: string) => {
    const formatted = formData.tipo_pessoa === "pj" ? formatCNPJ(value) : formatCPF(value);
    setFormData({ ...formData, cnpj_cpf: formatted });
  };

  const buscarCnpj = async () => {
    const cnpjNumbers = formData.cnpj_cpf.replace(/\D/g, "");
    if (cnpjNumbers.length !== 14) { setError("CNPJ inválido"); return; }
    setBuscandoCnpj(true);
    setError("");
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNumbers}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      setFormData({ ...formData, razao_social: data.razao_social || "", nome_fantasia: data.nome_fantasia || data.razao_social || "" });
    } catch (err: any) { setError(err.message); } finally { setBuscandoCnpj(false); }
  };

  const handleFinalize = async () => {
    setError("");
    if (!formData.nome_fantasia || !formData.cnpj_cpf) {
      setError("Preencha os campos obrigatórios");
      return;
    }

    setStep("processing");
    
    // Simulando a criação no Supabase
    setTimeout(() => {
      setLocalUser({ id: "new_user", name: formData.nome_responsavel, role: "admin" });
      setStep("success");
      setTimeout(() => router.push("/app"), 2000);
    }, 1500);
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
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">CRIAR CONTA</h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Sua jornada inteligente começa aqui</p>
            </div>
          </div>

          {step === "form" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={formData.tipo_pessoa === "pj" ? "default" : "outline"}
                  className={`h-14 rounded-2xl border-zinc-800 ${formData.tipo_pessoa === "pj" ? "bg-orange-600" : "text-zinc-500"}`}
                  onClick={() => setFormData({ ...formData, tipo_pessoa: "pj", cnpj_cpf: "" })}
                >
                  <Building2 className="mr-2 w-4 h-4" /> PJ
                </Button>
                <Button
                  variant={formData.tipo_pessoa === "pf" ? "default" : "outline"}
                  className={`h-14 rounded-2xl border-zinc-800 ${formData.tipo_pessoa === "pf" ? "bg-orange-600" : "text-zinc-500"}`}
                  onClick={() => setFormData({ ...formData, tipo_pessoa: "pf", cnpj_cpf: "" })}
                >
                  <User className="mr-2 w-4 h-4" /> PF
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">Documento (CNPJ/CPF)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl focus:border-orange-500 transition-all"
                      value={formData.cnpj_cpf}
                      onChange={(e) => handleDocChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                    {formData.tipo_pessoa === "pj" && (
                      <Button variant="outline" onClick={buscarCnpj} className="h-14 w-14 rounded-2xl border-zinc-800 bg-zinc-950 text-orange-500">
                        {buscandoCnpj ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">Nome Fantasia / Apelido</Label>
                  <Input 
                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl mt-1"
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">Seu Nome</Label>
                  <Input 
                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl mt-1"
                    value={formData.nome_responsavel}
                    onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

              <Button onClick={handleFinalize} className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-sm font-black uppercase italic rounded-2xl shadow-xl shadow-orange-900/20">
                Finalizar Cadastro
              </Button>
            </div>
          )}

          {step === "processing" && (
            <div className="py-20 flex flex-col items-center gap-6">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
              <p className="text-sm font-bold uppercase italic animate-pulse">Configurando seu Dashboard...</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-20 flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle className="text-green-500 w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic">SUCESSO!</h2>
                <p className="text-zinc-500 text-xs font-bold mt-2">Bem-vindo ao futuro da sua gestão.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

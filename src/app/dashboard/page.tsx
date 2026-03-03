"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Sparkles, Building2, Loader2, ArrowRight, Search, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Novos estados para o fluxo de CNPJ
  const [cnpj, setCnpj] = useState("");
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      // Se já tiver empresa vinculada, manda pro App
      if (session.user.user_metadata?.empresa_id) {
        window.location.href = "/app"; return;
      }
      setLoading(false);
    })();
  }, []);

  // FUNÇÃO MÁGICA: Busca CNPJ na BrasilAPI
  const buscarCnpj = async (cnpjDigitado: string) => {
    const cnpjLimpo = cnpjDigitado.replace(/\D/g, "");
    setCnpj(cnpjDigitado); // Mantém o que o usuário digita

    if (cnpjLimpo.length === 14) {
      setIsFetchingCnpj(true);
      setMsg(null);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
        if (!res.ok) throw new Error("CNPJ inválido ou não encontrado.");
        
        const data = await res.json();
        setRazaoSocial(data.razao_social);
        // Se a receita tiver o nome fantasia, já preenche. Senão, usa a razão social como base.
        setNomeFantasia(data.nome_fantasia || data.razao_social);
      } catch (err: any) {
        setMsg(err.message);
        setRazaoSocial("");
      } finally {
        setIsFetchingCnpj(false);
      }
    } else {
      setRazaoSocial("");
    }
  };

  // FUNÇÃO DE CRIAÇÃO DA EMPRESA E ATIVAÇÃO DO SAAS
  async function criarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    if (!razaoSocial || !nomeFantasia) {
      setMsg("Por favor, preencha um CNPJ válido primeiro.");
      return;
    }

    setIsSubmitting(true);
    setMsg(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Grava no banco de dados (Empresa)
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert([{ 
        name: nomeFantasia.trim(), // O nome fantasia é o principal
        razao_social: razaoSocial,
        cnpj: cnpj.replace(/\D/g, ""),
        created_by: session.user.id 
      }])
      .select("id")
      .single();

    if (companyErr) {
      setMsg("Erro no Banco de Dados: " + companyErr.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Vincula o Usuário como Dono (Admin)
    await supabase.from("company_users").insert([{ 
      company_id: company.id, 
      user_id: session.user.id, 
      role: "admin_empresa" 
    }]);

    // 3. O Pulo do Gato: Atualiza a sessão para o Dashboard ficar Universal
    await supabase.auth.updateUser({
      data: { 
        nome_empresa: nomeFantasia.trim(),
        empresa_id: company.id,
        plano: "Grátis" // Cliente entra no grátis
      }
    });

    window.location.href = "/app";
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-xl bg-white rounded-[45px] p-10 md:p-12 shadow-2xl relative z-10 border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
             <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">Registrar Unidade</h1>
          <p className="text-gray-400 font-bold italic uppercase text-[10px] tracking-widest mt-2">
            Insira seu CNPJ. Nós fazemos o resto.
          </p>
        </div>

        <form onSubmit={criarEmpresa} className="space-y-6">
          {/* CAMPO CNPJ */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2 italic">CNPJ do Restaurante</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <Input 
                className="h-16 pl-14 rounded-[25px] border-gray-100 bg-gray-50 font-black text-lg focus:bg-white transition-all tracking-widest" 
                value={cnpj} 
                onChange={(e) => buscarCnpj(e.target.value)} 
                placeholder="00.000.000/0001-00" 
                maxLength={18}
                required 
              />
              {isFetchingCnpj && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" size={20} />}
            </div>
          </div>

          {/* DADOS DA RECEITA (APARECEM SE ACHAR O CNPJ) */}
          {razaoSocial && (
            <div className="p-6 bg-green-50 rounded-[30px] border border-green-100 space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                 <CheckCircle2 size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest italic">Dados Localizados</span>
              </div>
              
              <div>
                <p className="text-[9px] uppercase tracking-widest text-green-600/60 font-black italic mb-1">Razão Social (Receita Federal)</p>
                <p className="font-bold text-sm text-green-900 opacity-80 uppercase leading-tight">{razaoSocial}</p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-widest text-green-600/60 font-black italic mb-2">Nome do App (Como seus funcionários verão)</p>
                <Input 
                  className="h-14 rounded-2xl border-green-200 bg-white font-black uppercase tracking-tighter text-gray-800" 
                  value={nomeFantasia} 
                  onChange={(e) => setNomeFantasia(e.target.value)} 
                  required 
                />
              </div>
            </div>
          )}

          <Button disabled={isSubmitting || !razaoSocial} className="w-full h-16 rounded-[25px] bg-gradient-to-r from-gray-900 to-gray-800 text-white font-black italic uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalizar e Entrar no Sistema <ArrowRight className="ml-2" size={18} /></>}
          </Button>
        </form>

        {msg && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase italic tracking-widest text-center border border-red-100">{msg}</div>}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Sparkles, Building2, Loader2, ArrowRight } from "lucide-react";

const DEFAULT_FEATURES = [
  { feature: "caixa_entrada", enabled: true },
  { feature: "assessor_ia", enabled: true },
  { feature: "cotacao", enabled: true },
  { feature: "estoque", enabled: true },
  { feature: "produtos_master", enabled: true },
];

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: link } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (link?.company_id) { window.location.href = "/app"; return; }
      setLoading(false);
    })();
  }, []);

  async function criarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1) Cria a Empresa no Banco
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert([{ name: companyName.trim(), created_by: session.user.id }])
      .select("id")
      .single();

    if (companyErr) {
      setMsg("Erro ao criar empresa: " + companyErr.message);
      setIsSubmitting(false);
      return;
    }

    // 2) Vincula o Usuário (Admin) e Features
    await supabase.from("company_users").insert([{ company_id: company.id, user_id: session.user.id, role: "admin_empresa" }]);
    await supabase.from("company_features").insert(DEFAULT_FEATURES.map((f) => ({ company_id: company.id, ...f })));

    // 3) O PULO DO GATO: Atualiza o Metadata para o App ficar Universal e Rápido
    await supabase.auth.updateUser({
      data: { 
        nome_empresa: companyName.trim(),
        empresa_id: company.id,
        nivel_acesso: 'admin'
      }
    });

    window.location.href = "/app";
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="w-full max-w-xl bg-white rounded-[45px] p-12 shadow-2xl relative z-10 border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
             <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">Configurar Unidade</h1>
          <p className="text-gray-400 font-bold italic uppercase text-[10px] tracking-widest mt-2">Dê um nome ao seu novo centro de comando</p>
        </div>

        <form onSubmit={criarEmpresa} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2 italic">Nome da Empresa / SaaS</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <Input className="h-16 pl-14 rounded-[25px] border-gray-100 bg-gray-50 font-bold text-lg focus:bg-white transition-all" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Pappi Pizza Campinas" required />
            </div>
          </div>
          <Button disabled={isSubmitting} className="w-full h-16 rounded-[25px] bg-gradient-to-r from-orange-600 to-pink-600 text-white font-black italic uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <>Criar e Aceder <ArrowRight className="ml-2" size={18} /></>}
          </Button>
        </form>
      </div>
    </main>
  );
}

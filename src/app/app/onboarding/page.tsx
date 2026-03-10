"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Check, Building2, Rocket, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [empresa, setEmpresa] = useState("");
  const [plano, setPlano] = useState("starter");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  const handleFinalize = async () => {
    if (!supabase || !empresa) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: emp } = await supabase.from("empresas").insert([{ nome: empresa, plano }]).select().single();
      if (emp) {
        await supabase.from("user_profiles").update({ empresa_id: emp.id, plano, role: 'master' }).eq("id", user?.id);
        router.push("/app");
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        {step === 1 ? (
          <div className="space-y-8">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[32px] flex items-center justify-center mx-auto mb-8"><Building2 size={40}/></div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Nome da sua <span className="text-orange-500">Empresa</span></h1>
            <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex: Pizzaria do Pappi" className="w-full p-6 rounded-3xl border-2 border-gray-100 focus:border-orange-500 outline-none text-center text-xl font-bold italic" />
            <button onClick={() => setStep(2)} disabled={!empresa} className="w-full bg-zinc-900 text-white p-6 rounded-3xl font-black italic uppercase tracking-widest disabled:opacity-50">Próximo Passo</button>
          </div>
        ) : (
          <div className="space-y-8">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Escolha seu <span className="text-orange-500">Plano</span></h1>
            <div className="grid grid-cols-1 gap-4">
              {['starter', 'profissional', 'gestao_completa'].map((p) => (
                <div key={p} onClick={() => setPlano(p)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex justify-between items-center ${plano === p ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                  <span className="font-black italic uppercase tracking-widest">{p.replace('_', ' ')}</span>
                  {plano === p && <Check className="text-orange-500" />}
                </div>
              ))}
            </div>
            <button onClick={handleFinalize} className="w-full bg-orange-500 text-white p-6 rounded-3xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : "Finalizar Configuração"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { registrarEmpresa } from "@/app/actions/onboarding";
import { Rocket, ShieldCheck, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await registrarEmpresa(formData);
    
    if (res.success) {
      window.location.href = "/app/dashboard";
    } else {
      alert(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="mb-12">
          <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">Passo Único</span>
          <h1 className="text-5xl font-black italic uppercase text-gray-800 tracking-tighter mt-4">Configurar sua Operação</h1>
          <p className="text-gray-400 font-medium text-lg italic">Vamos criar sua empresa universal agora.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-8 rounded-4xl border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Nome da Empresa / Pizzeria</label>
            <input 
              name="nome_empresa"
              required
              placeholder="Ex: Pappi Gestor"
              className="w-full bg-white border-2 border-gray-100 p-5 rounded-2xl text-xl font-bold italic outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-gray-900 text-white p-6 rounded-3xl font-black italic uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-2xl disabled:opacity-50"
          >
            {loading ? "Criando Ecossistema..." : "Liberar Acesso Total"}
            <Rocket size={20} />
          </button>
        </form>

        <div className="mt-12 flex items-center gap-4 text-gray-400">
          <ShieldCheck size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest">Seus dados estão protegidos por criptografia de nível bancário.</p>
        </div>
      </div>
    </div>
  );
}

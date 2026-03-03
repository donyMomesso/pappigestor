"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/react-app/components/ui/button";
import { Sparkles, ArrowRight, ShieldCheck, Check, Crown, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Se já houver um ID de pizzaria no navegador, manda direto para o app
  useEffect(() => {
    const pId = localStorage.getItem("pId");
    if (pId) {
      router.push("/app/dashboard");
    }
  }, [router]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // Esta rota /auth/callback é onde faremos o isolamento de dados
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    
    if (error) console.error("Erro ao iniciar login:", error.message);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* SEÇÃO BRANDING - IMPACTO TOTAL */}
      <div className="flex-1 bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 p-12 md:p-16 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/10 backdrop-blur-xl rounded-[22px] border border-white/20 shadow-2xl">
                <Sparkles className="w-8 h-8 text-white" />
             </div>
             <span className="text-3xl font-black italic uppercase tracking-tighter">Pappi Gestor</span>
          </div>
        </div>

        <div className="relative z-10 mb-20">
           <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl">
             DOMINE <br /> O SEU <br /> <span className="text-orange-200">LUCRO</span>.
           </h1>
           <p className="text-orange-50 text-xl font-bold italic max-w-md border-l-4 border-orange-300 pl-6 uppercase tracking-tighter">
             Inteligência Artificial para o Food Service.
           </p>
        </div>
        
        {/* Marca d'água estilizada */}
        <div className="absolute -right-20 -bottom-20 text-[500px] font-black italic text-white/5 leading-none uppercase select-none pointer-events-none">
          P
        </div>
      </div>

      {/* SEÇÃO LOGIN E PLANOS */}
      <div className="w-full md:w-[750px] p-8 md:p-16 flex flex-col justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-xl mx-auto space-y-12">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Acesso Restrito</h2>
            <p className="text-gray-400 font-bold italic uppercase text-[10px] tracking-[0.3em] mt-4">
              Escolha seu plano e comece a gerir com IA
            </p>
          </div>

          <div className="space-y-8">
            <Button 
              onClick={handleLogin}
              className="w-full h-20 bg-white border-4 border-gray-50 rounded-[30px] flex items-center justify-center gap-6 text-gray-700 font-black italic uppercase text-xs tracking-[0.2em] hover:border-orange-500 hover:bg-orange-50 transition-all shadow-xl shadow-gray-100 group"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              Entrar com Google
              <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-2 transition-transform" />
            </Button>

            {/* GRADE DE PLANOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PricingCard 
                plan="Grátis" 
                price="R$ 0" 
                features={["5 Notas/mês", "1 Unidade", "Básico IA"]} 
                color="bg-gray-50 text-gray-400 border-transparent" 
              />
              <PricingCard 
                plan="Básico" 
                price="R$ 49,90" 
                features={["50 Notas", "DDA Ativo", "Suporte"]} 
                color="bg-orange-50 text-orange-600 border-orange-100" 
                icon={<Zap size={14}/>}
                highlight 
              />
              <PricingCard 
                plan="Pro" 
                price="R$ 99,90" 
                features={["Ilimitado", "Assessor IA", "Ranking"]} 
                color="bg-gray-900 text-white border-transparent" 
                icon={<Crown size={14} className="text-orange-400" />}
              />
            </div>
          </div>

          {/* RODAPÉ DE SEGURANÇA */}
          <div className="pt-8 border-t border-gray-100 flex items-start gap-4">
             <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
               <ShieldCheck size={24}/>
             </div>
             <div>
                <p className="text-xs font-black italic uppercase text-gray-800 tracking-tight">Ambiente Seguro & Isolado</p>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Seus dados e de seus clientes são protegidos por criptografia de ponta a ponta e isolamento total por empresa (Tenant Isolation).
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Card de Preço
function PricingCard({ plan, price, features, color, highlight, icon }: any) {
  return (
    <div className={`p-6 rounded-[35px] border flex flex-col justify-between transition-all hover:shadow-2xl hover:-translate-y-1 ${color} cursor-default`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-black uppercase tracking-widest italic opacity-80">{plan}</p>
          {icon}
        </div>
        <p className="text-2xl font-black italic tracking-tighter mb-4 leading-none">
          {price}<span className="text-[10px] opacity-60 ml-1">/mês</span>
        </p>
      </div>
      <ul className="space-y-2">
        {features.map((f: string) => (
          <li key={f} className="text-[8px] font-black uppercase italic flex items-center gap-2 leading-none">
            <Check size={10} className={highlight ? 'text-orange-600' : 'text-current'} strokeWidth={4} /> 
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Mail, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  Building2
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Lógica: Login com E-mail (Magic Link)
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });

    if (error) {
      if (error.message.includes("rate limit")) {
        setMessage("❌ Limite de e-mails atingido. Por favor, use 'Entrar com Google' ou aguarde 1 hora.");
      } else {
        setMessage("Erro: " + error.message);
      }
    } else {
      setMessage("✅ Link enviado! Verifique seu e-mail.");
    }
    setLoading(false);
  };

  // 2. Lógica: Login com Google (COM GMAIL SCOPES)
  const loginGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
        redirectTo: window.location.origin + "/auth/callback",
        queryParams: {
          access_type: 'offline', 
          prompt: 'consent',     
        },
      },
    });
    
    if (error) {
      setMessage("Erro ao conectar com Google: " + error.message);
      setLoading(false);
    }
  };

  const LOGO_URL = "/logo.png"; // Alterado para buscar a logo da sua pasta public se tiver

  return (
    // AQUI MUDEI O FUNDO PARA O SEU BANNER
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[url('/banner.png')] bg-cover bg-center">
      
      {/* Adicionei um filtro escuro caso a imagem seja muito clara para dar contraste ao modal */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white relative z-10">
        
        {/* Lado Esquerdo: Branding Agressivo */}
        <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-white/20 backdrop-blur-lg w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <img src={LOGO_URL} alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-4xl font-black italic uppercase leading-tight tracking-tighter">
              Pappi <br /> Gestor
            </h1>
            <p className="mt-4 text-orange-100 font-medium italic uppercase tracking-tighter">
              O cérebro estratégico do seu negócio.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <Feature icon={<Zap size={18}/>} text="Processamento instantâneo de NF-e" />
            <Feature icon={<ShieldCheck size={18}/>} text="Gestão Multi-empresa Segura" />
            <Feature icon={<Sparkles size={18}/>} text="Assessor IA em tempo real" />
          </div>

          <div className="absolute -bottom-10 -left-10 text-[180px] font-black italic opacity-10 pointer-events-none">
            P
          </div>
        </div>

        {/* Lado Direito: Formulário Dual-Login */}
        <div className="p-12 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <h2 className="text-2xl font-black italic text-gray-800 uppercase tracking-tighter">Acesso ao Sistema</h2>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Escolha seu método de entrada</p>
          </div>

          <div className="space-y-6">
            {/* Opção 1: Google */}
            <button 
              onClick={loginGoogle}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-black italic uppercase text-xs tracking-widest flex items-center justify-center gap-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              </div>
              {loading ? "Conectando..." : "Entrar com Google"}
            </button>

            {/* Separador */}
            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-300 uppercase italic">OU</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            {/* Opção 2: Magic Link */}
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">E-mail Profissional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="email" 
                    placeholder="exemplo@empresa.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? "Processando..." : (
                  <>
                    Receber Acesso <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black text-center italic uppercase tracking-tighter ${message.includes("✅") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
              {message}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2">
              <Building2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Pappi SaaS Universal</span>
            </div>
            <span className="text-[10px] font-bold tracking-tighter uppercase">v2.0.26</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold italic uppercase tracking-tighter">
      <div className="bg-white/10 p-2 rounded-lg">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
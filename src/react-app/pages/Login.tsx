"use client";

import React, { useEffect } from "react";
// O import correto para Next.js quando você usa rotas tradicionais no cliente:
import { useNavigate } from "react-router-dom"; 
import { useAppAuth } from "../contexts/AppAuthContext";
import { Button } from "../components/ui/button";
import { 
  Loader2, 
  UserPlus, 
  LogIn,
  ArrowRight,
  CheckCircle2,
  Zap,
  BrainCircuit,
  ShieldCheck,
  Target,
  Users,
  BarChart3,
  XCircle,
  Sparkles
} from "lucide-react";
import Link from "next/link";

// Logo oficial que você definiu
const LOGO_URL = "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

export default function LoginPage() {
  const { localUser, setLocalUser } = useAppAuth();
  const navigate = useNavigate();

  // Redireciona se já estiver logado
  useEffect(() => {
    if (localUser && localUser.id !== "local") {
      navigate("/app");
    }
  }, [localUser, navigate]);

  // Função Simples de Login (Simulando a entrada para o seu App)
  const handleGoogleLogin = () => {
    // Aqui no futuro conectaremos o Supabase Auth. 
    // Por enquanto, vamos destravar o acesso ao App:
    const mockUser = { id: "user_123", name: "Dony Momesso", role: "admin" };
    setLocalUser(mockUser);
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-8 shadow-2xl">
          
          {/* Logo e Cabeçalho */}
          <div className="flex flex-col items-center gap-6">
            <img
              src={LOGO_URL}
              alt="Pappi Gestor"
              className="w-24 h-24 object-contain"
            />
            <div className="text-center">
              <h1 className="text-2xl font-black uppercase italic text-white tracking-tighter">
                Pappi<span className="text-orange-500">Gestor</span>
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                Inteligência Comercial
              </p>
            </div>
          </div>

          {/* Botão de Login Estilizado conforme a Landing Page */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-16 text-sm font-black uppercase italic tracking-widest bg-orange-600 hover:bg-orange-500 rounded-2xl transition-all flex gap-3"
          >
            <LogIn size={20} /> Entrar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-600 font-bold">Ou</span></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 border-zinc-800 text-zinc-400 hover:bg-zinc-800 rounded-2xl text-xs font-bold uppercase italic"
            onClick={() => navigate("/cadastro")}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Criar conta grátis
          </Button>
        </div>

        <p className="text-center mt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
          Pappi Gestor • Campinas, SP • 2026
        </p>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { 
  ArrowRight, Loader2, CheckCircle2, 
  Zap, BrainCircuit, ShieldCheck, 
  Target, Users, BarChart3, XCircle
} from "lucide-react";
import Link from "next/link";

// --- COMPONENTES INTERNOS ---

function ItemPlano({ text, active = false, cross = false }: { text: string, active?: boolean, cross?: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight 
      ${cross ? 'text-zinc-700' : active ? 'text-zinc-100' : 'text-zinc-500'}`}>
      {cross ? <XCircle size={14} className="text-red-900/40" /> : <CheckCircle2 size={14} className={active ? 'text-orange-500' : 'text-zinc-700'} />}
      <span className={cross ? 'line-through opacity-40' : ''}>{text}</span>
    </li>
  );
}

function CardRecurso({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-3xl hover:border-orange-500/30 transition-all">
      <div className="text-orange-500 mb-6">{icon}</div>
      <h3 className="text-lg font-black uppercase italic mb-3 text-white">{title}</h3>
      <p className="text-zinc-500 text-xs font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---

export default function LandingPage() {
  const { localUser } = useAppAuth();
  const router = useRouter();
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const user = localUser as any;
    if (user && user.plano && user.plano !== "Grátis") {
      router.push("/app");
    } else {
      setIsMounting(false);
    }
  }, [localUser, router]);

  if (isMounting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500">
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <BrainCircuit size={22} className="text-orange-500" />
          <span className="text-xl font-black uppercase italic tracking-tighter">Pappi<span className="text-orange-500">Gestor</span></span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Entrar</Link>
          <Link href="/login?signup=true" className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-full text-[10px] font-black uppercase italic transition-all">Começar</Link>
        </div>
      </nav>

      {/* HERO - A FRASE IMPACTANTE */}
      <section className="relative pt-48 pb-32 px-6 max-w-5xl mx-auto text-center">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8">
          TRANSFORME DADOS EM <br />
          <span className="text-orange-500">INTELIGÊNCIA REAL.</span>
        </h1>

        <p className="text-zinc-400 font-medium text-lg max-w-2xl mx-auto mb-12">
          O Pappi Gestor usa IA para ler notas, organizar seu estoque e automatizar suas compras de forma automática.
        </p>

        <Link href="/login?signup=true" className="inline-flex items-center gap-4 bg-white text-black px-10 py-6 rounded-2xl font-black uppercase italic hover:scale-105 transition-all shadow-xl">
          Destravar Meu Lucro <ArrowRight size={20} />
        </Link>
      </section>

      {/* RECURSOS */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardRecurso icon={<Target size={28}/>} title="CMV Real" desc="Saiba o custo exato do seu produto hoje, sem precisar de planilhas." />
        <CardRecurso icon={<Users size={28}/>} title="Cotação Inteligente" desc="IA que encontra o melhor preço entre seus fornecedores rapidamente." />
        <CardRecurso icon={<ShieldCheck size={28}/>} title="Aviso de Estoque" desc="Alertas antes do insumo acabar. Nunca mais pare sua pizzaria." />
        <CardRecurso icon={<BarChart3 size={28}/>} title="Leitura de XML" desc="Suba a nota fiscal e a IA cadastra tudo no estoque em segundos." />
      </section>

      {/* PLANOS */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          <div className="bg-zinc-900/20 border border-zinc-800 p-10 rounded-[32px] flex flex-col opacity-70">
            <h3 className="text-zinc-500 font-bold uppercase text-xs mb-4 italic">Start</h3>
            <div className="text-3xl font-black mb-8 italic">GRÁTIS</div>
            <ul className="space-y-4 mb-10 flex-1">
              <ItemPlano text="Gestão Manual" active />
              <ItemPlano text="Sem Inteligência" cross />
            </ul>
            <Link href="/login?signup=true" className="w-full py-4 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-center hover:bg-zinc-800 transition-all">Começar</Link>
          </div>

          <div className="bg-orange-600 p-10 rounded-[32px] flex flex-col transform md:scale-105 shadow-2xl shadow-orange-600/30">
            <h3 className="text-orange-200 font-bold uppercase text-[9px] mb-4 tracking-[0.3em]">RECOMENDADO</h3>
            <div className="text-5xl font-black mb-8 italic text-white">R$ 99<span className="text-sm">/mês</span></div>
            <ul className="space-y-4 mb-10 flex-1">
              <ItemPlano text="Assessor IA de Compras" active />
              <ItemPlano text="Scanner HD de Notas" active />
              <ItemPlano text="IA no WhatsApp" active />
            </ul>
            <Link href="/login?signup=true" className="w-full py-5 bg-white text-black rounded-xl text-[11px] font-black uppercase italic text-center hover:bg-zinc-100 transition-all">Assinar Pro</Link>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-800 p-10 rounded-[32px] flex flex-col">
            <h3 className="text-zinc-500 font-bold uppercase text-xs mb-4 italic">Gestor</h3>
            <div className="text-3xl font-black mb-8 italic text-white">R$ 49<span className="text-sm">/mês</span></div>
            <ul className="space-y-4 mb-10 flex-1">
              <ItemPlano text="Financeiro DDA" active />
              <ItemPlano text="Estoque Real" active />
              <ItemPlano text="Sem Inteligência" cross />
            </ul>
            <Link href="/login?signup=true" className="w-full py-4 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-center hover:bg-zinc-800 transition-all">Escolher</Link>
          </div>

        </div>
      </section>

      <footer className="py-20 text-center border-t border-zinc-900 opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-widest italic">Pappi Gestor • 2026</p>
      </footer>

    </div>
  );
}

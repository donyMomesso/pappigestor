"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { useAppAuth } from "../react-app/contexts/AppAuthContext";

// Use os nomes originais dos ícones em inglês
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Zap, 
  BrainCircuit, 
  ShieldCheck, 
  Target, 
  Users, 
  BarChart3, 
  XCircle,
  Sparkles // <--- Adicione esta palavra aqui
} from "lucide-react";

import Link from "next/link";

// --- COMPONENTES DE APOIO ---

function FeatureItem({ text, active = false, cross = false }: { text: string, active?: boolean, cross?: boolean }) {
=======
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Zap,
  BrainCircuit,
  ShieldCheck,
  Target,
  Users,
  BarChart3,
  XCircle
} from "lucide-react";

// --- COMPONENTES INTERNOS ---

function ItemPlano({ text, active = false, cross = false }: { text: string, active?: boolean, cross?: boolean }) {
>>>>>>> 6b3080d09ffb10c96d0954c16a0bd7fced41b936
  return (
    <li className={`flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight 
      ${cross ? 'text-zinc-700' : active ? 'text-zinc-100' : 'text-zinc-500'}`}>
      {cross ? <XCircle size={14} className="text-red-900/40" /> : <CheckCircle2 size={14} className={active ? 'text-orange-500' : 'text-zinc-700'} />}
      <span className={cross ? 'line-through opacity-40' : ''}>{text}</span>
    </li>
  );
}

<<<<<<< HEAD
function CardDisc({ icon, title, profile, desc }: { icon: React.ReactNode, title: string, profile: string, desc: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-orange-500/40 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-white/5 px-4 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
        Perfil {profile}
      </div>
      <div className="text-orange-500 mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-black uppercase italic mb-2 text-white tracking-tight">{title}</h3>
      <p className="text-zinc-400 text-xs font-medium leading-relaxed italic">{desc}</p>
=======
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

>>>>>>> 6b3080d09ffb10c96d0954c16a0bd7fced41b936
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
    if (user && user.id !== "local") {
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
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <BrainCircuit size={22} className="text-orange-500" />
          <span className="text-xl font-black uppercase italic tracking-tighter text-white">
            Pappi<span className="text-orange-500">Gestor</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Entrar</Link>
          <Link href="/login?signup=true" className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-full text-[10px] font-black uppercase italic transition-all shadow-lg shadow-orange-600/20">Criar Conta</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-48 pb-24 px-6 max-w-5xl mx-auto text-center">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-8 animate-pulse">
          <Sparkles size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] italic text-orange-400">Inteligência Artificial Ativa</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8 text-white">
          TRANSFORME DADOS EM <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">INTELIGÊNCIA REAL.</span>
        </h1>

        <p className="text-zinc-400 font-medium text-lg max-w-2xl mx-auto mb-12 italic">
          O Pappi Gestor usa IA para ler notas, organizar seu estoque e automatizar suas compras de forma automática.
        </p>

        <Link href="/login?signup=true" className="inline-flex items-center gap-4 bg-white text-black px-10 py-6 rounded-2xl font-black uppercase italic hover:scale-105 transition-all shadow-2xl">
          Destravar Meu Lucro <ArrowRight size={20} />
        </Link>
      </section>

      {/* SEÇÃO D.I.S.C. - ESTRATÉGIA PSICOLÓGICA VOLTOU */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardDisc 
            profile="Dominância"
            icon={<Target size={28}/>} 
            title="Lucro Real" 
            desc="Tome o controle. Tenha o CMV atualizado por IA em tempo real para decidir rápido." 
          />
          <CardDisc 
            profile="Influência"
            icon={<Users size={28}/>} 
            title="Time Ágil" 
            desc="Cotações automáticas no WhatsApp que facilitam a vida da sua equipe e fornecedores." 
          />
          <CardDisc 
            profile="Estabilidade"
            icon={<ShieldCheck size={28}/>} 
            title="Segurança" 
            desc="Nunca mais tenha surpresas. O sistema avisa antes do estoque acabar, mantendo a paz na operação." 
          />
          <CardDisc 
            profile="Conformidade"
            icon={<BarChart3 size={28}/>} 
            title="Precisão" 
            desc="Leitura cirúrgica de XML e notas fiscais. Organização absoluta sem erro humano." 
          />
        </div>
      </section>

      {/* PREÇOS */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          
          <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[40px] flex flex-col h-full opacity-60">
            <h3 className="text-zinc-500 font-bold uppercase text-xs mb-4">Pappi Start</h3>
            <div className="text-3xl font-black italic mb-8 text-white">GRÁTIS</div>
            <ul className="space-y-4 mb-10 flex-1">
              <FeatureItem text="Gestão de Estoque Manual" active />
              <FeatureItem text="Cadastro de Insumos" active />
              <FeatureItem text="Sem Inteligência" cross />
            </ul>
            <Link href="/login?signup=true" className="w-full py-4 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-center hover:bg-zinc-800 transition-all italic">Começar</Link>
          </div>

          <div className="bg-orange-600 p-[2px] rounded-[42px] shadow-[0_0_80px_rgba(234,88,12,0.2)] transform md:scale-110 z-20">
            <div className="bg-black rounded-[40px] p-10 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-3xl font-black italic text-[9px] uppercase tracking-widest">MELHOR OPÇÃO</div>
              <h3 className="text-2xl font-black italic uppercase text-orange-500">Pappi Pro IA</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-6xl font-black italic text-white">R$ 99</span>
                <span className="text-xs font-bold text-zinc-500 uppercase">/mês</span>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                <FeatureItem text="Assessor IA de Compras" active />
                <FeatureItem text="Scanner HD de Notas" active />
                <FeatureItem text="Inteligência no WhatsApp" active />
              </ul>
              <Link href="/login?signup=true">
                <button className="w-full py-6 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase italic shadow-xl hover:bg-orange-500 transition-all">Assinar Agora</button>
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[40px] flex flex-col h-full">
            <h3 className="text-zinc-400 font-bold uppercase text-xs mb-4">Pappi Gestor</h3>
            <div className="flex items-baseline gap-1 my-4">
              <span className="text-4xl font-black italic text-white">R$ 49</span>
              <span className="text-xs font-bold text-zinc-500 uppercase">/mês</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <FeatureItem text="Financeiro DDA" active />
              <FeatureItem text="Estoque em Tempo Real" active />
              <FeatureItem text="Sem Inteligência" cross />
            </ul>
            <Link href="/login?signup=true" className="w-full py-4 border border-zinc-700 rounded-2xl text-[10px] font-black uppercase text-center hover:bg-zinc-800 transition-all italic">Escolher Gestor</Link>
          </div>

        </div>
      </section>

      <footer className="py-24 text-center border-t border-zinc-900">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] italic">
          Pappi Gestor • Campinas, SP • 2026
        </p>
      </footer>

    </div>
  );
}
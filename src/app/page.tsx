"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  ShieldCheck,
  Target,
  Users,
  BarChart3,
  XCircle,
} from "lucide-react";

// --- COMPONENTES DE APOIO ---
function FeatureItem({
  text,
  active = false,
  cross = false,
}: { text: string; active?: boolean; cross?: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 text-xs font-bold uppercase tracking-tight 
      ${cross ? "text-zinc-600" : active ? "text-zinc-100" : "text-zinc-400"}`}
    >
      {cross ? (
        <XCircle size={16} className="text-red-900/60" />
      ) : (
        <CheckCircle2
          size={16}
          className={active ? "text-orange-500" : "text-zinc-600"}
        />
      )}
      <span className={cross ? "line-through opacity-40" : ""}>{text}</span>
    </li>
  );
}

function CardDisc({
  icon,
  title,
  profile,
  desc,
}: { icon: React.ReactNode; title: string; profile: string; desc: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl hover:border-orange-500/50 transition-all group relative overflow-hidden shadow-lg">
      <div className="absolute top-0 right-0 bg-zinc-800 px-4 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 italic">
        Perfil {profile}
      </div>
      <div className="text-orange-500 mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase italic mb-3 text-white tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se já estiver autenticado, manda direto para a área do app
    if (status === "authenticated") {
      router.push("/app");
    }
  }, [status, router]);

  const irParaCadastro = () => router.push("/cadastro");
  const irParaLogin = () => router.push("/app");

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500">
      {/* HEADER NAVBAR */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo(0, 0)}
        >
          <BrainCircuit size={26} className="text-orange-500" />
          <span className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Pappi<span className="text-orange-500">Gestor</span>
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={irParaLogin}
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={irParaCadastro}
            className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-2xl text-xs font-black uppercase italic transition-all shadow-lg shadow-orange-900/50"
          >
            Criar Conta
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-8">
          <Sparkles size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic text-orange-400">
            Inteligência Artificial Ativa
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8 text-white">
          TRANSFORME DADOS EM <br />
          <span className="text-orange-500">INTELIGÊNCIA REAL.</span>
        </h1>

        <p className="text-zinc-400 font-medium text-lg max-w-2xl mx-auto mb-12">
          O Pappi Gestor usa IA para ler notas, organizar seu estoque e automatizar suas compras de forma 100% automática.
        </p>

        <button
          onClick={irParaCadastro}
          className="inline-flex items-center justify-center gap-4 bg-white text-black px-10 py-6 rounded-2xl font-black uppercase italic hover:bg-zinc-200 transition-all shadow-2xl w-full sm:w-auto text-lg"
        >
          Destravar Meu Lucro <ArrowRight size={24} />
        </button>
      </section>

      {/* SEÇÃO D.I.S.C. */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardDisc
            profile="Dominância"
            icon={<Target size={32} />}
            title="Lucro Real"
            desc="Tome o controle. Tenha o CMV atualizado por IA em tempo real para decidir rápido."
          />
          <CardDisc
            profile="Influência"
            icon={<Users size={32} />}
            title="Time Ágil"
            desc="Cotações automáticas no WhatsApp que facilitam a vida da sua equipe e fornecedores."
          />
          <CardDisc
            profile="Estabilidade"
            icon={<ShieldCheck size={32} />}
            title="Segurança"
            desc="Nunca mais tenha surpresas. O sistema avisa antes do estoque acabar, mantendo a paz na operação."
          />
          <CardDisc
            profile="Conformidade"
            icon={<BarChart3 size={32} />}
            title="Precisão"
            desc="Leitura cirúrgica de XML e notas fiscais. Organização absoluta sem erro humano."
          />
        </div>
      </section>

      {/* PREÇOS */}
      <section className="py-24 px-6 max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] flex flex-col h-full">
            <h3 className="text-zinc-500 font-bold uppercase text-sm mb-4">Pappi Start</h3>
            <div className="text-4xl font-black italic mb-8 text-white">GRÁTIS</div>
            <ul className="space-y-5 mb-10 flex-1">
              <FeatureItem text="Gestão de Estoque Manual" active />
              <FeatureItem text="Cadastro de Insumos" active />
              <FeatureItem text="Sem Inteligência" cross />
            </ul>
            <button
              onClick={irParaCadastro}
              className="w-full py-5 border border-zinc-700 rounded-2xl text-xs font-black uppercase text-center hover:bg-zinc-800 transition-all italic text-white"
            >
              Começar
            </button>
          </div>

          <div className="bg-orange-600 p-[2px] rounded-[42px] shadow-2xl transform md:scale-105 z-20">
            <div className="bg-zinc-950 rounded-[40px] p-10 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-3xl font-black italic text-[10px] uppercase tracking-widest">
                MELHOR OPÇÃO
              </div>
              <h3 className="text-2xl font-black italic uppercase text-orange-500 mt-2">Pappi Pro IA</h3>
              <div className="flex items-baseline gap-1 my-6">
                <span className="text-6xl font-black italic text-white">R$ 99</span>
                <span className="text-sm font-bold text-zinc-500 uppercase">/mês</span>
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                <FeatureItem text="Assessor IA de Compras" active />
                <FeatureItem text="Scanner HD de Notas" active />
                <FeatureItem text="Inteligência no WhatsApp" active />
              </ul>
              <button
                onClick={irParaCadastro}
                className="w-full py-6 bg-orange-600 text-white rounded-2xl text-sm font-black uppercase italic shadow-xl hover:bg-orange-500 transition-all text-center"
              >
                Assinar Agora
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] flex flex-col h-full">
            <h3 className="text-zinc-400 font-bold uppercase text-sm mb-4">Pappi Gestor</h3>
            <div className="flex items-baseline gap-1 my-6">
              <span className="text-5xl font-black italic text-white">R$ 49</span>
              <span className="text-sm font-bold text-zinc-500 uppercase">/mês</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <FeatureItem text="Financeiro DDA" active />
              <FeatureItem text="Estoque em Tempo Real" active />
              <FeatureItem text="Sem Inteligência" cross />
            </ul>
            <button
              onClick={irParaCadastro}
              className="w-full py-5 border border-zinc-700 rounded-2xl text-xs font-black uppercase text-center hover:bg-zinc-800 transition-all italic text-white"
            >
              Escolher Gestor
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center border-t border-zinc-900 mt-12">
        <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.4em] italic">
          Pappi Gestor • Campinas, SP • 2026
        </p>
      </footer>
    </div>
  );
}
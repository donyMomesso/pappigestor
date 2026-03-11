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
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-orange-500/50 transition-all group relative overflow-hidden shadow">
      <div className="absolute top-0 right-0 bg-zinc-800 px-3 py-1 rounded-bl-md text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 italic">
        Perfil {profile}
      </div>
      <div className="text-orange-500 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-black uppercase italic mb-2 text-white tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

// --- PÁGINA PRINCIPAL (MEIO A MEIO) ---
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/app");
    }
  }, [status, router]);

  const irParaCadastro = () => router.push("/cadastro");
  const irParaLogin = () => router.push("/app");

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500">
      {/* NAV */}
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
            className="bg-orange-600 hover:bg-orange-500 px-5 py-2 rounded-2xl text-xs font-black uppercase italic transition-all shadow-lg shadow-orange-900/50"
          >
            Criar Conta
          </button>
        </div>
      </nav>

      {/* CONTAINER MEIO A MEIO */}
      <main className="pt-24">
        <div className="min-h-[calc(100vh-96px)] grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: HERO (metade esquerda) */}
          <section className="flex items-center justify-center px-6 py-12 lg:py-24">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-6">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic text-orange-400">
                  Inteligência Artificial Ativa
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-6 text-white">
                TRANSFORME DADOS EM <br />
                <span className="text-orange-500">INTELIGÊNCIA REAL.</span>
              </h1>

              <p className="text-zinc-400 font-medium text-lg max-w-lg mb-8">
                O Pappi Gestor usa IA para ler notas, organizar seu estoque e automatizar suas compras de forma 100% automática.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button
                  onClick={irParaCadastro}
                  className="inline-flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-black uppercase italic hover:bg-zinc-200 transition-all shadow-lg text-base"
                >
                  Destravar Meu Lucro <ArrowRight size={18} />
                </button>

                <button
                  onClick={irParaLogin}
                  className="inline-flex items-center justify-center gap-2 border border-zinc-700 px-6 py-4 rounded-2xl font-black uppercase italic text-zinc-300 hover:text-white transition-all text-base"
                >
                  Entrar no Painel
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT: FEATURES + PREÇOS (metade direita) */}
          <aside className="bg-gradient-to-b from-[#070707] to-[#0b0b0b] px-6 py-12 lg:py-24 overflow-auto">
            <div className="max-w-xl mx-auto space-y-10">
              {/* DISC CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardDisc
                  profile="Dominância"
                  icon={<Target size={28} />}
                  title="Lucro Real"
                  desc="Tome o controle. Tenha o CMV atualizado por IA em tempo real para decidir rápido."
                />
                <CardDisc
                  profile="Influência"
                  icon={<Users size={28} />}
                  title="Time Ágil"
                  desc="Cotações automáticas no WhatsApp que facilitam a vida da sua equipe e fornecedores."
                />
                <CardDisc
                  profile="Estabilidade"
                  icon={<ShieldCheck size={28} />}
                  title="Segurança"
                  desc="Nunca mais tenha surpresas. O sistema avisa antes do estoque acabar, mantendo a paz na operação."
                />
                <CardDisc
                  profile="Conformidade"
                  icon={<BarChart3 size={28} />}
                  title="Precisão"
                  desc="Leitura cirúrgica de XML e notas fiscais. Organização absoluta sem erro humano."
                />
              </div>

              {/* PLANOS (compacto) */}
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="text-sm text-zinc-400 font-bold uppercase">Pappi Start</h4>
                      <p className="text-2xl font-black text-white mt-2">GRÁTIS</p>
                    </div>
                    <div>
                      <button
                        onClick={irParaCadastro}
                        className="px-4 py-2 rounded-lg border border-zinc-700 text-xs font-black uppercase text-white"
                      >
                        Começar
                      </button>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-zinc-400 text-xs">
                    <FeatureItem text="Gestão de Estoque Manual" active />
                    <FeatureItem text="Cadastro de Insumos" active />
                    <FeatureItem text="Sem Inteligência" cross />
                  </ul>
                </div>

                <div className="bg-orange-600 p-[2px] rounded-2xl shadow-lg">
                  <div className="bg-zinc-950 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black italic text-orange-500">Pappi Pro IA</h4>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">R$ 99</div>
                        <div className="text-xs text-zinc-400">/mês</div>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-zinc-300 text-sm">
                      <FeatureItem text="Assessor IA de Compras" active />
                      <FeatureItem text="Scanner HD de Notas" active />
                      <FeatureItem text="Inteligência no WhatsApp" active />
                    </ul>
                    <div className="mt-4">
                      <button
                        onClick={irParaCadastro}
                        className="w-full py-3 bg-orange-600 text-white rounded-xl font-black uppercase"
                      >
                        Assinar Agora
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="text-sm text-zinc-400 font-bold uppercase">Pappi Gestor</h4>
                      <p className="text-2xl font-black text-white mt-2">R$ 49</p>
                    </div>
                    <div>
                      <button
                        onClick={irParaCadastro}
                        className="px-4 py-2 rounded-lg border border-zinc-700 text-xs font-black uppercase text-white"
                      >
                        Escolher
                      </button>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-zinc-400 text-xs">
                    <FeatureItem text="Financeiro DDA" active />
                    <FeatureItem text="Estoque em Tempo Real" active />
                    <FeatureItem text="Sem Inteligência" cross />
                  </ul>
                </div>
              </div>

              {/* RODAPÉ CURTO */}
              <div className="text-center text-xs text-zinc-500">
                Pappi Gestor • Campinas, SP • 2026
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
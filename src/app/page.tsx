"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/contexts/AppAuthContext";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  ShieldCheck,
  BarChart3,
  XCircle,
  Bot,
  Store,
  Wallet,
  Package,
  ClipboardList,
} from "lucide-react";

function FeatureItem({
  text,
  active = false,
  cross = false,
}: {
  text: string;
  active?: boolean;
  cross?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 text-xs font-bold uppercase tracking-tight ${
        cross ? "text-zinc-600" : active ? "text-zinc-100" : "text-zinc-400"
      }`}
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

function ValueCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl hover:border-orange-500/40 transition-all group shadow-lg">
      <div className="text-orange-500 mb-5 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase italic mb-3 text-white tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm">
      <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-black italic mb-4">
        {number}
      </div>
      <h3 className="text-lg font-black italic uppercase tracking-tight text-gray-900">
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed mt-2">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const { localUser } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (localUser && localUser.id !== "local") {
      router.push("/app");
    }
  }, [localUser, router]);

  const irParaCadastro = () => router.push("/cadastro");
  const irParaLogin = () => router.push("/login");

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <BrainCircuit size={24} className="text-orange-500" />
            </div>
            <span className="text-2xl font-black uppercase italic tracking-tighter text-white">
              Pappi<span className="text-orange-500">Gestor</span>
            </span>
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={irParaLogin}
              className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              Entrar
            </button>

            <button
              onClick={irParaCadastro}
              className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-2xl text-xs font-black uppercase italic transition-all shadow-lg shadow-orange-900/40"
            >
              Começar grátis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 md:pt-48 pb-24 px-6 overflow-hidden">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[680px] h-[680px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-8">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic text-orange-400">
              inteligência operacional para food service
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8 text-white">
            SEU RESTAURANTE <br />
            MERECE UM <span className="text-orange-500">CÉREBRO.</span>
          </h1>

          <p className="text-zinc-300 font-medium text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            O Pappi Gestor lê notas, organiza estoque, ajuda nas compras,
            acompanha o financeiro e transforma rotina em decisão inteligente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={irParaCadastro}
              className="inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase italic hover:bg-zinc-200 transition-all shadow-2xl w-full sm:w-auto text-base md:text-lg"
            >
              Começar grátis
              <ArrowRight size={22} />
            </button>

            <button
              onClick={irParaLogin}
              className="inline-flex items-center justify-center gap-3 border border-zinc-700 bg-zinc-900/70 text-white px-10 py-5 rounded-2xl font-black uppercase italic hover:border-orange-500/40 hover:bg-zinc-900 transition-all w-full sm:w-auto text-base"
            >
              Entrar no sistema
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 italic mb-2">
                estoque
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Veja antes o que vai faltar e gere compras com mais clareza.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 italic mb-2">
                compras
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Compare melhor, organize pedidos e reduza decisões no susto.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 italic mb-2">
                financeiro
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Entenda o que está pesando no caixa e aja mais rápido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALOR DO PRODUTO */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="max-w-3xl mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 italic mb-4">
            feito para operação real
          </p>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
            MENOS ACHISMO. <br />
            MAIS CONTROLE.
          </h2>
          <p className="text-zinc-400 text-base mt-5 max-w-2xl leading-relaxed">
            O Pappi Gestor foi pensado para restaurantes, pizzarias e operações
            de food service que precisam de clareza no dia a dia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ValueCard
            icon={<Package size={32} />}
            title="Estoque vivo"
            desc="Acompanhe insumos e itens críticos antes que eles atrapalhem sua produção."
          />
          <ValueCard
            icon={<ClipboardList size={32} />}
            title="Compras inteligentes"
            desc="Tenha apoio para gerar listas, organizar reposição e comprar melhor."
          />
          <ValueCard
            icon={<Wallet size={32} />}
            title="Financeiro claro"
            desc="Veja o que entra, o que sai e onde sua margem está sendo pressionada."
          />
          <ValueCard
            icon={<Bot size={32} />}
            title="IA aplicada"
            desc="Receba leitura operacional, alertas e direcionamentos que economizam energia mental."
          />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 italic mb-4">
              entrada simples
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
              ENTRE, CONFIGURE <br />
              E COMECE CERTO.
            </h2>
            <p className="text-gray-500 text-base mt-5 max-w-2xl leading-relaxed">
              A ideia é simples: você entra, ativa sua empresa e começa a usar o
              sistema com uma base muito mais organizada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="1"
              title="Crie sua conta"
              desc="Comece com o responsável principal da operação em poucos passos."
            />
            <StepCard
              number="2"
              title="Ative sua empresa"
              desc="Informe o CNPJ e monte sua base inicial com mais velocidade."
            />
            <StepCard
              number="3"
              title="Entre no dashboard"
              desc="Receba visão de estoque, financeiro e prioridades logo no começo."
            />
          </div>
        </div>
      </section>

      {/* CONFIANÇA */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[36px] p-8 md:p-10 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ShieldCheck className="text-orange-500" size={22} />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">
                Segurança e estrutura
              </h3>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Seus dados ficam organizados por empresa, com uma experiência
              pensada para crescer com a operação.
            </p>

            <ul className="space-y-4">
              <FeatureItem text="Ambiente por empresa" active />
              <FeatureItem text="Entrada guiada" active />
              <FeatureItem text="Base pronta para escalar" active />
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 rounded-[36px] p-8 md:p-10 shadow-xl text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] italic text-orange-100 mb-4">
              por que isso importa
            </p>

            <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">
              O DONO PRECISA SENTIR QUE O SISTEMA TRABALHA COM ELE.
            </h3>

            <p className="text-orange-50/90 text-sm md:text-base leading-relaxed mt-5">
              Quando a entrada é clara, rápida e útil, o usuário entende valor
              antes mesmo de explorar todos os módulos.
            </p>

            <button
              onClick={irParaCadastro}
              className="mt-8 inline-flex items-center gap-3 bg-white text-black px-7 py-4 rounded-2xl text-xs font-black uppercase italic hover:bg-zinc-100 transition-all"
            >
              Criar conta agora
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="py-24 px-6 max-w-6xl mx-auto relative z-10">
        <div className="max-w-3xl mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 italic mb-4">
            planos
          </p>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
            ESCOLHA O RITMO DA SUA EVOLUÇÃO.
          </h2>
          <p className="text-zinc-400 text-base mt-5 max-w-2xl leading-relaxed">
            Comece com o essencial ou suba para uma camada com mais inteligência
            operacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] flex flex-col h-full">
            <h3 className="text-zinc-500 font-bold uppercase text-sm mb-4">
              Pappi Start
            </h3>
            <div className="text-4xl font-black italic mb-8 text-white">
              GRÁTIS
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <FeatureItem text="Gestão de estoque manual" active />
              <FeatureItem text="Cadastro de insumos" active />
              <FeatureItem text="Sem inteligência avançada" cross />
            </ul>
            <button
              onClick={irParaCadastro}
              className="w-full py-5 border border-zinc-700 rounded-2xl text-xs font-black uppercase text-center hover:bg-zinc-800 transition-all italic text-white"
            >
              Começar grátis
            </button>
          </div>

          <div className="bg-orange-600 p-[2px] rounded-[42px] shadow-2xl transform md:scale-105 z-20">
            <div className="bg-zinc-950 rounded-[40px] p-10 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-3xl font-black italic text-[10px] uppercase tracking-widest">
                melhor opção
              </div>

              <h3 className="text-2xl font-black italic uppercase text-orange-500 mt-2">
                Pappi Pro IA
              </h3>

              <div className="flex items-baseline gap-1 my-6">
                <span className="text-6xl font-black italic text-white">
                  R$ 99
                </span>
                <span className="text-sm font-bold text-zinc-500 uppercase">
                  /mês
                </span>
              </div>

              <ul className="space-y-6 mb-12 flex-1">
                <FeatureItem text="Assessor IA de compras" active />
                <FeatureItem text="Leitura de notas e documentos" active />
                <FeatureItem text="Inteligência operacional" active />
              </ul>

              <button
                onClick={irParaCadastro}
                className="w-full py-6 bg-orange-600 text-white rounded-2xl text-sm font-black uppercase italic shadow-xl hover:bg-orange-500 transition-all text-center"
              >
                Assinar agora
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] flex flex-col h-full">
            <h3 className="text-zinc-400 font-bold uppercase text-sm mb-4">
              Pappi Gestor
            </h3>
            <div className="flex items-baseline gap-1 my-6">
              <span className="text-5xl font-black italic text-white">
                R$ 49
              </span>
              <span className="text-sm font-bold text-zinc-500 uppercase">
                /mês
              </span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <FeatureItem text="Financeiro organizado" active />
              <FeatureItem text="Estoque em tempo real" active />
              <FeatureItem text="Sem IA avançada" cross />
            </ul>
            <button
              onClick={irParaCadastro}
              className="w-full py-5 border border-zinc-700 rounded-2xl text-xs font-black uppercase text-center hover:bg-zinc-800 transition-all italic text-white"
            >
              Escolher gestor
            </button>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[40px] bg-white text-gray-900 p-10 md:p-14 shadow-2xl">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 italic mb-4">
              pronto para começar
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
              ENTRE NO PAPPI GESTOR E COMECE A ORGANIZAR SUA OPERAÇÃO COM MAIS INTELIGÊNCIA.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mt-5 max-w-2xl">
              Crie sua conta, ative sua empresa e veja o sistema começar a
              trabalhar com você desde a entrada.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={irParaCadastro}
                className="inline-flex items-center justify-center gap-3 bg-orange-600 text-white px-8 py-5 rounded-2xl text-sm font-black uppercase italic hover:bg-orange-500 transition-all"
              >
                Criar conta grátis
                <ArrowRight size={18} />
              </button>

              <button
                onClick={irParaLogin}
                className="inline-flex items-center justify-center gap-3 border border-gray-200 px-8 py-5 rounded-2xl text-sm font-black uppercase italic text-gray-800 hover:bg-gray-50 transition-all"
              >
                Já tenho conta
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center border-t border-zinc-900">
        <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.4em] italic">
          Pappi Gestor • Campinas, SP • 2026
        </p>
      </footer>
    </div>
  );
}

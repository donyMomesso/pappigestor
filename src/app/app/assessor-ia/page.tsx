"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAppAuthOptional } from "@/contexts/AppAuthContext";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  RefreshCcw,
  Zap,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function AssessorIAPage() {
  const auth = useAppAuthOptional();
  const localUser = auth?.localUser ?? null;

  const firstName = localUser?.nome?.split(" ")[0] || "gestor";
  const companyName = localUser?.nome_empresa || "sua operação";

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-3xl font-black text-gray-900 italic uppercase tracking-tighter flex items-center gap-3">
              Assessor IA
            </h1>
            <p className="text-gray-400 font-black italic uppercase text-[10px] tracking-[0.2em]">
              Inteligência aplicada à redução de custos
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-black italic uppercase text-xs tracking-widest shadow-xl shadow-purple-200 hover:scale-105 transition-all">
          <RefreshCcw size={16} /> Nova análise global
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard
          title="Oportunidade"
          desc="Identificamos 3 fornecedores com preços 15% abaixo da sua última cotação."
          icon={<Zap className="text-purple-600" size={24} />}
          action="Ver cotações"
          color="bg-purple-50"
        />
        <InsightCard
          title="Alerta estoque"
          desc="5 itens de alto giro estão próximos do fim. Sugerimos reposição imediata."
          icon={<AlertCircle className="text-rose-500" size={24} />}
          action="Gerar lista"
          color="bg-rose-50"
        />
        <InsightCard
          title="Fluxo caixa"
          desc="Seu gasto subiu 8% esta semana. Verifique a variação de preço da farinha."
          icon={<TrendingUp className="text-blue-500" size={24} />}
          action="Ver gráficos"
          color="bg-blue-50"
        />
      </div>

      <div className="bg-white rounded-[45px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col min-h-[550px] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 to-transparent pointer-events-none" />

        <div className="p-8 border-b border-gray-50 bg-white/50 backdrop-blur-md flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Sparkles size={24} />
            </div>

            <div>
              <h3 className="font-black italic text-gray-900 uppercase tracking-tighter text-lg">
                Consultor estratégico
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest italic">
                  IA online • pronta para analisar
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              Cérebro: GPT-4o Premium
            </span>
          </div>
        </div>

        <div className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-6 relative z-10">
          <div className="bg-purple-100/50 p-8 rounded-[35px] text-purple-600 mb-2 shadow-inner">
            <Lightbulb size={56} className="animate-pulse" />
          </div>

          <h2 className="text-2xl font-black italic text-gray-900 uppercase tracking-tighter">
            Como posso ajudar <span className="text-purple-600">{firstName}</span> hoje?
          </h2>

          <p className="text-gray-500 max-w-md mx-auto font-bold italic text-sm leading-relaxed">
            Pergunte sobre custos, peça uma previsão de estoque ou solicite um ranking
            dos melhores fornecedores da {companyName}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mt-8">
            <SuggestionButton text="Qual fornecedor é mais barato hoje?" />
            <SuggestionButton text="Analise meu desperdício de estoque" />
          </div>
        </div>

        <div className="p-10 bg-white relative z-10">
          <div className="relative max-w-4xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[30px] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            <input
              type="text"
              placeholder="Digite sua dúvida estratégica aqui..."
              className="relative w-full pl-8 pr-20 py-6 rounded-[28px] bg-gray-50 border-none outline-none focus:ring-2 focus:ring-purple-500 font-bold italic text-gray-700 shadow-inner text-lg"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-600 text-white p-4 rounded-2xl hover:bg-purple-700 transition-all shadow-xl hover:scale-105 active:scale-95">
              <Sparkles size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  desc,
  icon,
  action,
  color,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  action: string;
  color: string;
}) {
  return (
    <div
      className={`p-8 rounded-[40px] ${color} border border-white shadow-sm flex flex-col h-full justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group`}
    >
      <div>
        <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
          {icon}
        </div>
        <h3 className="font-black italic text-gray-900 uppercase text-md tracking-tighter mb-2">
          {title}
        </h3>
        <p className="text-gray-500 text-xs font-bold italic leading-relaxed mb-6 opacity-80">
          {desc}
        </p>
      </div>

      <button className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2 hover:gap-3 transition-all italic">
        {action} <ArrowRight size={14} className="text-purple-600" />
      </button>
    </div>
  );
}

function SuggestionButton({ text }: { text: string }) {
  return (
    <button className="text-left p-5 rounded-[22px] border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50 transition-all text-xs font-black italic uppercase tracking-tighter text-gray-500 flex items-center justify-between group">
      "{text}"
      <ArrowRight
        size={16}
        className="text-purple-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
      />
    </button>
  );
}
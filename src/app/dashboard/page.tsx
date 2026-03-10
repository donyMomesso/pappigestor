"use client";

import React from "react";
import Link from "next/link";
import { 
  BrainCircuit, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Package,
  DollarSign,
  Users,
  Star
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-white">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
              <BrainCircuit size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black italic uppercase tracking-tighter">
              Pappi<span className="text-orange-500">Gestor</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase italic tracking-widest text-zinc-400">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <Link href="/login" className="text-white bg-white/5 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all">Entrar</Link>
            <Link href="/login" className="bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all">Começar Grátis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full mb-8">
            <Zap size={14} className="text-orange-500" />
            <span className="text-[10px] font-black uppercase italic tracking-widest text-orange-500">A Inteligência que seu Restaurante precisava</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-8 leading-[0.9]">
            Gestão <span className="text-orange-500">Inteligente</span>  
Para Food Service.
          </h1>
          <p className="text-zinc-400 text-lg font-bold italic max-w-2xl mx-auto mb-12 leading-relaxed">
            Controle estoque, financeiro e compras com o poder da IA. Economize tempo e dinheiro com a ferramenta mais completa do mercado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/login" className="w-full sm:w-auto bg-orange-500 text-white px-12 py-6 rounded-[24px] font-black italic uppercase tracking-widest text-sm hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center gap-3">
              Criar Minha Conta <ArrowRight size={20} />
            </Link>
            <a href="#planos" className="w-full sm:w-auto bg-white/5 text-white px-12 py-6 rounded-[24px] font-black italic uppercase tracking-widest text-sm hover:bg-white/10 transition-all border border-white/10">
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-20 px-6 bg-white text-zinc-900 rounded-[60px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Escolha o seu <span className="text-orange-500">Plano</span></h2>
            <p className="text-zinc-400 font-bold italic">Cresça sua operação com inteligência e previsibilidade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PLANO STARTER */}
            <div className="p-10 rounded-[40px] border-2 border-zinc-100 flex flex-col">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black italic">R$ 9,90</span>
                <span className="text-xs font-bold text-zinc-400 uppercase italic">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-emerald-500" /> 2 Usuários</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-emerald-500" /> 500 Produtos</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-emerald-500" /> Estoque Completo</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-emerald-500" /> Relatórios Básicos</li>
              </ul>
              <Link href="/login" className="w-full py-5 bg-zinc-100 text-zinc-900 rounded-2xl font-black italic uppercase text-[10px] tracking-widest text-center hover:bg-zinc-200 transition-all">Assinar Agora</Link>
            </div>

            {/* PLANO PROFISSIONAL */}
            <div className="p-10 rounded-[40px] border-4 border-orange-500 shadow-2xl shadow-orange-500/10 flex flex-col relative scale-105 z-10 bg-white">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest">Mais Vendido</div>
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-6">
                <BrainCircuit size={32} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Profissional</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black italic">R$ 49,90</span>
                <span className="text-xs font-bold text-zinc-400 uppercase italic">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-orange-500" /> 5 Usuários</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-orange-500" /> 2000 Produtos</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-orange-500" /> IA de Compras</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-600"><CheckCircle2 size={18} className="text-orange-500" /> Importação de Notas</li>
              </ul>
              <Link href="/login" className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black italic uppercase text-[10px] tracking-widest text-center hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20">Assinar Agora</Link>
            </div>

            {/* PLANO GESTÃO COMPLETA */}
            <div className="p-10 rounded-[40px] border-2 border-zinc-900 bg-zinc-900 text-white flex flex-col">
              <div className="p-4 bg-zinc-800 text-orange-500 rounded-2xl w-fit mb-6">
                <Star size={32} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Gestão Completa</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black italic text-white">R$ 99,90</span>
                <span className="text-xs font-bold text-zinc-500 uppercase italic">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-400"><CheckCircle2 size={18} className="text-orange-500" /> Usuários Ilimitados</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-400"><CheckCircle2 size={18} className="text-orange-500" /> Open Finance</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-400"><CheckCircle2 size={18} className="text-orange-500" /> DDA Automático</li>
                <li className="flex items-center gap-3 text-sm font-bold italic text-zinc-400"><CheckCircle2 size={18} className="text-orange-500" /> IA Financeira</li>
              </ul>
              <Link href="/login" className="w-full py-5 bg-white text-zinc-900 rounded-2xl font-black italic uppercase text-[10px] tracking-widest text-center hover:bg-orange-500 hover:text-white transition-all">Assinar Agora</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

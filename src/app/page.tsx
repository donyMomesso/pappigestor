"use client";

import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Settings, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Bell,
  Search,
  PieChart,
  Calendar,
  Zap
} from "lucide-react";
import { useAppAuthOptional } from "@/app/app/layout";

// Componente de Card de Resumo (Stats)
function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase italic">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1">{title}</p>
        <h3 className="text-2xl font-black italic text-gray-900 tracking-tighter">{value}</h3>
      </div>
    </div>
  );
}

// Componente de Atalho Rápido
function QuickAction({ title, href, icon: Icon, description, color }: any) {
  return (
    <Link href={href} className="group">
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all h-full flex flex-col">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-black italic uppercase text-gray-900 tracking-tighter mb-1">{title}</h3>
        <p className="text-[11px] font-bold text-gray-400 italic leading-tight mb-4 flex-1">{description}</p>
        <div className="flex items-center text-[10px] font-black uppercase italic text-orange-500 tracking-widest group-hover:translate-x-1 transition-transform">
          Acessar <ArrowRight size={12} className="ml-1" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const auth = useAppAuthOptional();
  const user = auth?.localUser;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER DE BOAS-VINDAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            Olá, <span className="text-orange-500">{user?.nome?.split(' ')[0] || 'Gestor'}!</span>
          </h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic mt-2">
            Sua operação está <span className="text-emerald-500">100% saudável</span> hoje.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 transition-all shadow-sm">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
          <button className="flex items-center gap-3 bg-zinc-900 text-white px-6 py-4 rounded-2xl font-black italic uppercase text-[10px] tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-zinc-900/20">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Mensal" 
          value="R$ 42.500,00" 
          icon={DollarSign} 
          trend="+12%" 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Capital em Estoque" 
          value="R$ 12.840,00" 
          icon={Package} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Contas a Pagar (Hoje)" 
          value="R$ 1.250,00" 
          icon={Calendar} 
          trend="Urgente" 
          color="bg-rose-500" 
        />
        <StatCard 
          title="CMV Médio" 
          value="32.4%" 
          icon={PieChart} 
          color="bg-orange-500" 
        />
      </div>

      {/* SEÇÃO DE ATALHOS RÁPIDOS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">
            Gestão <span className="text-orange-500">360°</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAction 
            title="Estoque" 
            href="/app/estoque" 
            icon={Package} 
            description="Controle de inventário, auditoria e alertas de ruptura."
            color="bg-blue-600"
          />
          <QuickAction 
            title="Financeiro" 
            href="/app/financeiro" 
            icon={DollarSign} 
            description="Fluxo de caixa, DRE e contas a pagar/receber."
            color="bg-emerald-600"
          />
          <QuickAction 
            title="Compras" 
            href="/app/compras" 
            icon={ShoppingCart} 
            description="Sugestões de compra baseadas em IA e cotações."
            color="bg-orange-600"
          />
          <QuickAction 
            title="Equipe" 
            href="/app/equipe" 
            icon={Users} 
            description="Gestão de dependentes, cargos e permissões."
            color="bg-zinc-800"
          />
        </div>
      </div>

      {/* BANNER DE IA / INSIGHTS */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Zap size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-orange-500 text-white text-[9px] font-black uppercase italic px-2 py-1 rounded-lg tracking-widest">
              Pappi AI
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase italic">Insight do dia</span>
          </div>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 leading-tight">
            Seu CMV de <span className="text-orange-500">Queijo Mussarela</span> subiu 8% esta semana.
          </h3>
          <p className="text-sm font-bold text-zinc-400 italic mb-8 leading-relaxed">
            Identificamos que o fornecedor "Distribuidora X" aumentou o preço. Sugerimos cotar com a "Laticínios Y" para economizar até R$ 450,00 no próximo pedido.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/app/cotacao" className="bg-white text-zinc-900 px-8 py-4 rounded-2xl font-black italic uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-all">
              Ver Cotações
            </Link>
            <Link href="/app/assessor-ia" className="bg-zinc-700 text-white px-8 py-4 rounded-2xl font-black italic uppercase text-[10px] tracking-widest hover:bg-zinc-600 transition-all border border-zinc-600">
              Falar com Assessor
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

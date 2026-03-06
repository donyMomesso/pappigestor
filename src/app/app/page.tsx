"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { 
  ShoppingCart, DollarSign, Package, ClipboardList, 
  Sparkles, Building2, Settings2, Gift, Camera, 
  ArrowRight, ChevronRight, Coins, SearchCheck, 
  Calculator, MessageSquare, LayoutDashboard, Inbox, Users, Settings, X, Check
} from "lucide-react";

// Lista Mestra de todos os módulos para o Modal
const TODOS_MODULOS = [
  { id: "fin", title: "Financeiro", sub: "Fluxo e Boletos", icon: <DollarSign size={24} />, color: "text-orange-600", bg: "bg-orange-50", href: "/app/financeiro" },
  { id: "comp", title: "Compras", sub: "Nova provisão", icon: <ShoppingCart size={24} />, color: "text-amber-600", bg: "bg-amber-50", href: "/app/compras" },
  { id: "est", title: "Estoque", sub: "Auditoria real", icon: <Package size={24} />, color: "text-rose-600", bg: "bg-rose-50", href: "/app/estoque" },
  { id: "rec", title: "Recebimento", sub: "Bater notas", icon: <ClipboardList size={24} />, color: "text-pink-600", bg: "bg-pink-50", href: "/app/recebimento" },
  { id: "cot", title: "Cotação", sub: "Menor preço", icon: <Calculator size={24} />, color: "text-yellow-600", bg: "bg-yellow-50", href: "/app/cotacao" },
  { id: "forn", title: "Fornecedores", sub: "Contatos Zap", icon: <MessageSquare size={24} />, color: "text-green-600", bg: "bg-green-50", href: "/app/fornecedores" },
  { id: "prod", title: "Produtos", sub: "Catálogo Geral", icon: <Package size={24} />, color: "text-indigo-600", bg: "bg-indigo-50", href: "/app/produtos" },
  { id: "dash", title: "Dashboard", sub: "Performance", icon: <LayoutDashboard size={24} />, color: "text-slate-600", bg: "bg-slate-50", href: "/app/relatorios" },
  { id: "ia", title: "Assessor IA", sub: "Análise Smart", icon: <Sparkles size={24} />, color: "text-purple-600", bg: "bg-purple-50", href: "/app/assessor-ia" },
];

export default function Dashboard() {
  const { localUser } = useAppAuth();

  // Estado dos atalhos que aparecem na tela (Começa com os 4 padrões quentes)
  const [favoritos, setFavoritos] = useState(TODOS_MODULOS.slice(0, 4));
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selecaoTemporaria, setSelecaoTemporaria] = useState<string[]>(favoritos.map(f => f.id));

  // Função para selecionar/deselecionar módulos no Modal
  const toggleModulo = (id: string) => {
    if (selecaoTemporaria.includes(id)) {
      setSelecaoTemporaria(prev => prev.filter(item => item !== id));
    } else {
      if (selecaoTemporaria.length < 4) {
        setSelecaoTemporaria(prev => [...prev, id]);
      }
    }
  };

  // Salvar a escolha do cliente
  const salvarAtalhos = () => {
    const novosFavoritos = TODOS_MODULOS.filter(mod => selecaoTemporaria.includes(mod.id));
    setFavoritos(novosFavoritos);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 relative">
      
      {/* 1. CARD DE BOAS-VINDAS PREMIUM (Identidade Laranja Dominante) */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-8 border border-orange-400/30">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-white/20 px-4 py-1.5 rounded-full border border-white/20 italic backdrop-blur-md">
            Visão Geral
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-6 mb-2 italic uppercase tracking-tighter leading-none text-white drop-shadow-md">
            Olá, {localUser?.nome?.split(' ')[0] || 'Gestor'}! 
          </h1>
          <p className="text-orange-100 text-sm font-bold italic uppercase tracking-widest">
  {localUser?.nome_empresa || "Matriz"} • {(localUser as any)?.plano || "Plano Pro"}
          </p>
        </div>

        {/* Mini-resumo Rápido no topo */}
        <div className="relative z-10 flex gap-4">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[25px] min-w-[140px] shadow-xl">
              <p className="text-[9px] text-orange-100 uppercase tracking-[0.2em] font-black italic mb-1">A Pagar Hoje</p>
              <p className="text-2xl font-black italic uppercase tracking-tighter text-white">R$ 1.250</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[25px] min-w-[140px] shadow-xl">
              <p className="text-[9px] text-orange-100 uppercase tracking-[0.2em] font-black italic mb-1">Alertas</p>
              <p className="text-2xl font-black italic uppercase tracking-tighter text-yellow-300">03 Itens</p>
           </div>
        </div>

        <Building2 className="absolute -left-10 -bottom-10 text-white/10 w-64 h-64 pointer-events-none" />
      </div>

      {/* 2. ATALHOS PERSONALIZADOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-6 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
             <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">Acesso Rápido</h2>
          </div>
          
          {/* BOTÃO AGORA COM A FUNÇÃO ONCLICK */}
          <button 
            onClick={() => {
              setSelecaoTemporaria(favoritos.map(f => f.id));
              setIsModalOpen(true);
            }} 
            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
          >
            <Settings2 size={14} /> Editar Atalhos
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {favoritos.map((mod) => (
            <Link key={mod.id} href={mod.href} className="group">
              <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className={`${mod.bg} ${mod.color} w-14 h-14 rounded-[20px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800 italic uppercase tracking-tighter leading-none group-hover:text-orange-600 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-[9px] text-gray-400 mt-1 font-black uppercase tracking-widest italic leading-tight">
                    {mod.sub}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          
          {favoritos.length < 4 && (
            <button onClick={() => setIsModalOpen(true)} className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[30px] flex flex-col items-center justify-center p-6 text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50/50 transition-all">
              <Settings2 size={24} className="mb-2 opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Adicionar</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. BANNERS DE CRESCIMENTO E IA */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Banner: Indique e Ganhe */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-[35px] p-8 shadow-xl relative overflow-hidden group cursor-pointer border border-orange-500/20 hover:border-orange-500/50 transition-colors">
          <div className="relative z-10 flex flex-col h-full justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/30">
                <Coins size={20} />
              </div>
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] italic">Recompensa Ativa</span>
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">
              Indique e <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Ganhe</span>
            </h3>
            <p className="text-sm text-gray-400 font-bold italic uppercase tracking-tight mb-6">
              Ganhe mensalidades grátis indicando outros restaurantes para o Pappi.
            </p>
            <div className="flex items-center text-xs font-black uppercase italic tracking-widest text-orange-400 group-hover:text-yellow-400 transition-colors">
              Gerar meu link <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <Gift className="absolute -right-8 -bottom-8 w-40 h-40 text-orange-500/5 rotate-12 group-hover:text-orange-500/10 transition-colors" />
        </div>

        {/* Banner: Assessor IA */}
        <Link href="/app/assessor-ia" className="block group">
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-[35px] p-8 shadow-xl shadow-purple-500/20 relative overflow-hidden border border-purple-400/30 h-full hover:scale-[1.02] transition-transform duration-300">
            <div className="relative z-10 flex flex-col h-full justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm text-white">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-black text-purple-100 uppercase tracking-[0.3em] italic">💡 Dica Exclusiva</span>
              </div>
              
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">
                Use o Assessor IA
              </h3>
              <p className="text-sm text-purple-100 font-bold italic opacity-90 mb-6 leading-tight pr-10">
                Tire fotos de notas fiscais e a IA extrai os dados automaticamente! Sem digitação manual.
              </p>
              
              <div className="inline-flex items-center px-5 py-2.5 bg-white text-purple-600 rounded-full text-[10px] font-black uppercase italic tracking-widest shadow-lg group-hover:bg-gray-50 transition-colors w-fit">
                <Camera size={14} className="mr-2" /> Experimentar agora <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute right-10 bottom-10 w-24 h-24 bg-fuchsia-400/30 rounded-full blur-xl"></div>
          </div>
        </Link>
      </div>

      {/* ========================================= */}
      {/* MODAL DE EDIÇÃO DE ATALHOS */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Personalizar Dashboard</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mt-1">
                  Selecione até 4 módulos para acesso rápido ({selecaoTemporaria.length}/4)
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {TODOS_MODULOS.map((mod) => {
                  const isSelected = selecaoTemporaria.includes(mod.id);
                  const isDisabled = !isSelected && selecaoTemporaria.length >= 4;

                  return (
                    <div 
                      key={mod.id} 
                      onClick={() => !isDisabled && toggleModulo(mod.id)}
                      className={`relative p-5 rounded-[25px] border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center gap-3
                        ${isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-100 bg-white hover:border-orange-200'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-sm">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                      <div className={`${mod.color} ${mod.bg} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                        {mod.icon}
                      </div>
                      <div>
                        <h4 className="font-black italic uppercase tracking-tighter text-gray-800 leading-none">{mod.title}</h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-50 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarAtalhos} 
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest italic shadow-lg hover:shadow-orange-500/25 hover:scale-105 transition-all"
              >
                Salvar Atalhos
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppAuth } from "../../react-app/contexts/AppAuthContext";
import { 
  Building2, 
  ShoppingCart, 
  PackageSearch, 
  LineChart, 
  FileText, 
  Users, 
  Settings,
  Bot,
  Database,
  Pencil
} from "lucide-react";

// --- COMPONENTE DE CARD REUTILIZÁVEL (PREMIUM & DISCRETO) ---
function CardRecurso({
  title,
  desc,
  icon,
  onClick,
  colorClass = "text-zinc-100",
  bgClass = "bg-zinc-800",
  gradient = false
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass?: string;
  bgClass?: string;
  gradient?: boolean;
}) {
  return (
    <div 
      onClick={onClick}
      className={`relative border border-zinc-800 p-7 rounded-3xl hover:border-orange-500/30 cursor-pointer transition-all duration-300 group flex flex-col gap-5 shadow-inner hover:shadow-orange-950/20 overflow-hidden
        ${gradient ? 'bg-gradient-to-br from-orange-600 to-pink-600 text-white shadow-lg' : bgClass}`}
    >
      {gradient && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      )}
      
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${gradient ? 'bg-white/15 text-white' : 'bg-zinc-900/60 text-orange-500'} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      
      <div>
        <h3 className={`text-xl font-black uppercase italic tracking-tighter mb-1.5 ${gradient ? 'text-white' : 'text-white'}`}>
          {title}
        </h3>
        <p className={`text-sm font-medium leading-relaxed italic ${gradient ? 'text-orange-50' : 'text-zinc-400'}`}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// --- PÁGINA DO DASHBOARD PRINCIPAL ---
export default function AppDashboard() {
  const { localUser } = useAppAuth();
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState("Pappi Gestor");
  const [pId, setPId] = useState("");
  const [editingCompany, setEditingCompany] = useState(false);

  useEffect(() => {
    if (!localUser) {
      router.push("/login");
      return;
    }
    setNomeEmpresa(localUser.nome_empresa || localUser.name || "Pappi Gestor");
    setPId(localStorage.getItem("pId") || "");
  }, [localUser, router]);

  const salvarPId = () => {
    localStorage.setItem("pId", pId || "pappi");
    setEditingCompany(false);
    // window.location.reload(); // Removido o reload para uma experiência mais fluida
  };

  if (!localUser) return null;

  return (
    <div className="min-h-screen bg-[#020202] text-white p-6 md:p-10 pb-20 selection:bg-orange-500 relative">
      
      {/* Luz de fundo discreta */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-900/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* CABEÇALHO PREMIUM & DISCRETO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800 rounded-xl text-orange-500">
                <Database size={20} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                Painel <span className="text-orange-500">Estratégico</span>
              </h1>
            </div>
            
            <div className="mt-3.5 flex items-center gap-2 group">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic flex items-center gap-2">
                <Building2 size={12} className="text-orange-600" /> {nomeEmpresa}
              </p>
              <Pencil 
                size={12} 
                className="text-zinc-700 cursor-pointer group-hover:text-zinc-400 transition-colors" 
                onClick={() => setEditingCompany(!editingCompany)} 
              />
            </div>
          </div>

          <button 
            onClick={() => router.push("/app/empresas")}
            className="px-6 py-3 rounded-2xl bg-zinc-800 text-xs font-bold uppercase italic text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all shadow-md"
          >
            Mudar Empresa Ativa
          </button>
        </div>

        {/* ÁREA DE CONFIGURAÇÃO DE EMPRESA (EDITÁVEL & DISCRETA) */}
        {editingCompany && (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] shadow-2xl space-y-6 transform animate-in fade-in-50 zoom-in-95 duration-300">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Configurar Empresa Local</h2>
              <p className="text-sm font-medium text-zinc-500 italic mt-1">Defina o ID universal para conectar suas APIs Mock locais.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <input
                placeholder='Ex: "pappi_gestor_campinas"'
                value={pId}
                onChange={(e) => setPId(e.target.value)}
                className="h-14 rounded-2xl px-5 bg-zinc-950 border border-zinc-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none w-full sm:w-auto flex-1 transition-all text-sm font-medium italic"
              />
              <button
                onClick={salvarPId}
                className="h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-black uppercase italic px-10 transition-all shrink-0 shadow-lg shadow-orange-950/30 text-xs tracking-widest"
              >
                Salvar Empresa
              </button>
            </div>
          </div>
        )}

        {/* GRID DE MÓDULOS - VISUAL PREMIUM RESTAURADO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          
          <CardRecurso 
            title="Lista de Compras" 
            desc="Reposição, alertas e cotação automática via WhatsApp." 
            icon={<ShoppingCart size={32} />} 
            onClick={() => router.push("/app/lista-compras")} 
            gradient={true} // Aplica o degradê vibrante "orange-to-pink"
          />

          <CardRecurso 
            title="Assessor IA" 
            desc="Sugestões de compras e análise inteligente do seu estoque." 
            icon={<Bot size={32} />} 
            onClick={() => router.push("/app/assessor-ia")}
            colorClass="text-purple-400"
            bgClass="bg-purple-950/30"
          />

          <CardRecurso 
            title="Meu Estoque" 
            desc="Controle em tempo real de insumos e matérias-primas." 
            icon={<PackageSearch size={32} />} 
            onClick={() => router.push("/app/estoque")} 
          />

          <CardRecurso 
            title="Scanner de Notas" 
            desc="Leitura rápida de XML para dar entrada automática." 
            icon={<FileText size={32} />} 
            onClick={() => router.push("/app/recebimento")} 
          />

          <CardRecurso 
            title="Performance" 
            desc="Métricas estratégicas, lucros e análise de CMV." 
            icon={<LineChart size={32} />} 
            onClick={() => router.push("/app/dashboard")} 
            colorClass="text-green-400"
            bgClass="bg-green-950/30"
          />

          <CardRecurso 
            title="Fornecedores" 
            desc="Gestão da base, contatos e histórico de cotações." 
            icon={<Users size={32} />} 
            onClick={() => router.push("/app/fornecedores")} 
          />

        </div>

        {/* Rodapé Discreto */}
        <footer className="text-center pt-16 border-t border-zinc-900 mt-12">
          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] italic">
            Pappi Gestor • Campinas, SP • 2026
          </p>
        </footer>

      </div>
    </div>
  );
}
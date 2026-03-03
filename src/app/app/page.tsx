"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "../../react-app/contexts/AppAuthContext";
import { 
  Building2, 
  ShoppingCart, 
  PackageSearch, 
  LineChart, 
  FileText, 
  Users, 
  Settings,
  Bot
} from "lucide-react";

// --- COMPONENTE DE CARD REUTILIZÁVEL ---
function CardRecurso({
  title,
  desc,
  icon,
  onClick,
  colorClass = "text-orange-500",
  bgClass = "bg-orange-500/10",
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass?: string;
  bgClass?: string;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-orange-500/50 cursor-pointer transition-all group flex flex-col gap-4 shadow-sm hover:shadow-xl"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-black uppercase italic tracking-tight text-white mb-1">
          {title}
        </h3>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

// --- PÁGINA DO DASHBOARD ---
export default function AppDashboard() {
  const { localUser } = useAppAuth();
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState("Pappi Gestor");

  useEffect(() => {
    // Redireciona para login se não houver usuário
    if (!localUser) {
      router.push("/login");
      return;
    }
    // Pega o nome da empresa ou o nome do usuário
    setNomeEmpresa(localUser.nome_empresa || localUser.name || "Pappi Gestor");
  }, [localUser, router]);

  if (!localUser) return null; // Evita piscar a tela antes do redirecionamento

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pb-24 md:p-10 md:pb-10 selection:bg-orange-500">
      
      {/* HEADER DO DASHBOARD */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
            Painel Estratégico
          </h1>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
            <Building2 size={12} /> {nomeEmpresa}
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => router.push("/app/empresas")}
            className="px-5 py-3 rounded-2xl border border-zinc-800 text-xs font-bold uppercase italic hover:bg-zinc-800 transition-colors"
          >
            Trocar Empresa
          </button>
        </div>
      </div>

      {/* GRID DE MÓDULOS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        <CardRecurso 
          title="Assessor IA" 
          desc="Sugestões de compras e análise inteligente do seu estoque." 
          icon={<Bot size={24} />} 
          onClick={() => router.push("/app/assessor-ia")}
          colorClass="text-purple-500"
          bgClass="bg-purple-500/10"
        />

        <CardRecurso 
          title="Lista de Compras" 
          desc="Reposição, alertas e cotação automática via WhatsApp." 
          icon={<ShoppingCart size={24} />} 
          onClick={() => router.push("/app/lista-compras")} 
        />

        <CardRecurso 
          title="Meu Estoque" 
          desc="Controle em tempo real de insumos e matérias-primas." 
          icon={<PackageSearch size={24} />} 
          onClick={() => router.push("/app/estoque")} 
        />

        <CardRecurso 
          title="Scanner de Notas" 
          desc="Leitura rápida de XML para dar entrada automática." 
          icon={<FileText size={24} />} 
          onClick={() => router.push("/app/recebimento")} 
        />

        <CardRecurso 
          title="Dashboard" 
          desc="Métricas de performance, lucros e CMV." 
          icon={<LineChart size={24} />} 
          onClick={() => router.push("/app/dashboard")} 
          colorClass="text-green-500"
          bgClass="bg-green-500/10"
        />

        <CardRecurso 
          title="Fornecedores" 
          desc="Gestão da base, contatos e histórico de cotações." 
          icon={<Users size={24} />} 
          onClick={() => router.push("/app/fornecedores")} 
        />

        <CardRecurso 
          title="Configurações" 
          desc="Ajustes da conta, usuários e preferências do sistema." 
          icon={<Settings size={24} />} 
          onClick={() => router.push("/app/configuracoes")}
          colorClass="text-zinc-400"
          bgClass="bg-zinc-800/50"
        />

      </div>

    </div>
  );
}
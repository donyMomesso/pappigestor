"use client";

import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button"; // <--- ADICIONE ESTA LINHA
import { 
  TrendingDown, TrendingUp, BarChart3, 
  PieChart, Target, AlertTriangle, ArrowRight 
} from "lucide-react";

export default function DashboardPage() {
  const { localUser } = useAppAuth();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Painel Estratégico</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3 italic">Métricas de performance da {localUser?.nome_empresa}</p>
        </div>
        
        <div className="flex gap-2">
           <div className="bg-white border border-gray-100 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] font-black uppercase italic text-gray-500">Fluxo: Saudável</span>
           </div>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Custo Insumos" value="R$ 12.400" trend="-4%" isPositive={true} />
        <StatCard title="Desperdício Est." value="R$ 840" trend="+12%" isPositive={false} />
        <StatCard title="Economia Cotação" value="R$ 2.150" trend="Recorde" isPositive={true} />
        <StatCard title="DDA a Vencer" value="04 Boletos" trend="Hoje" isPositive={null} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Curva ABC (Placeholder Visual) */}
        <Card className="lg:col-span-2 border-gray-100 rounded-[45px] bg-white shadow-xl overflow-hidden p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-orange-500" /> Curva ABC de Gastos
            </h3>
            <span className="text-[9px] font-black uppercase bg-gray-50 px-3 py-1 rounded-full text-gray-400 italic">Últimos 30 dias</span>
          </div>
          
          <div className="h-64 flex items-end gap-4 px-4">
             {/* Simulação de barras premium */}
             <div className="flex-1 bg-gradient-to-t from-orange-500 to-pink-500 rounded-t-2xl h-[90%] relative group">
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">Proteínas</span>
             </div>
             <div className="flex-1 bg-gray-100 rounded-t-2xl h-[60%] hover:bg-orange-200 transition-colors"></div>
             <div className="flex-1 bg-gray-100 rounded-t-2xl h-[45%] hover:bg-orange-200 transition-colors"></div>
             <div className="flex-1 bg-gray-100 rounded-t-2xl h-[30%] hover:bg-orange-200 transition-colors"></div>
             <div className="flex-1 bg-gray-100 rounded-t-2xl h-[15%] hover:bg-orange-200 transition-colors"></div>
          </div>
        </Card>

        {/* Alertas da IA */}
        <Card className="border-gray-100 rounded-[45px] bg-gray-900 text-white shadow-xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={120} /></div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2 relative z-10">
            <AlertTriangle className="text-yellow-400" size={20} /> Alertas IA
          </h3>
          
          <div className="space-y-6 relative z-10">
            <AlertItem text="Preço da Farinha subiu 15% no Fornecedor A" />
            <AlertItem text="Estoque de Embalagens acaba em 3 dias" />
            <AlertItem text="Oportunidade: Mozzarella R$ 4,00 mais barata no Ranking" />
          </div>

          <Button className="w-full mt-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl h-14 font-black italic uppercase text-[10px] tracking-widest transition-all">
             Ver Todos os Insights <ArrowRight size={14} className="ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, isPositive }: any) {
  return (
    <Card className="border-gray-100 rounded-[35px] bg-white shadow-sm hover:shadow-lg transition-all p-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">{title}</p>
      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">{value}</h4>
      <div className={`mt-4 flex items-center gap-1 text-[10px] font-black uppercase italic ${isPositive === null ? 'text-gray-400' : isPositive ? 'text-green-600' : 'text-red-500'}`}>
         {isPositive !== null && (isPositive ? <TrendingDown size={14} /> : <TrendingUp size={14} />)}
         {trend}
      </div>
    </Card>
  );
}

function AlertItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-4 group cursor-pointer">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 group-hover:scale-150 transition-transform"></div>
      <p className="text-xs font-bold italic opacity-80 group-hover:opacity-100 transition-opacity leading-relaxed">{text}</p>
    </div>
  );
}
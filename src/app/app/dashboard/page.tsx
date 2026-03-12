"use client";

import { useMemo } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { useDashboard } from "@/react-app/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import {
  TrendingDown,
  TrendingUp,
  BarChart3,
  Target,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCcw,
} from "lucide-react";

function moneyBRL(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const { localUser } = useAppAuth();
  const { loading, error, refresh, kpis, alertas } = useDashboard();

  const fluxoLabel = useMemo(() => {
    if (kpis.lucro < 0) return { text: "Fluxo: Negativo", color: "bg-red-500" };
    if (kpis.itensCriticos > 0) return { text: "Fluxo: Atenção", color: "bg-yellow-500" };
    return { text: "Fluxo: Saudável", color: "bg-green-500" };
  }, [kpis.lucro, kpis.itensCriticos]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            Painel Estratégico
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3 italic">
            Métricas de performance da {localUser?.nome_empresa || "sua empresa"}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${fluxoLabel.color}`} />
            <span className="text-[10px] font-black uppercase italic text-gray-500">
              {fluxoLabel.text}
            </span>
          </div>

          <Button
            onClick={refresh}
            className="rounded-2xl h-[46px] px-4 gap-2"
            variant="outline"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest italic">
              Atualizar
            </span>
          </Button>
        </div>
      </div>

      {/* Erro (se der) */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
          <p className="text-sm font-bold">Erro ao carregar dashboard: {error}</p>
        </div>
      )}

      {/* Grid de KPIs (agora reais do Supabase) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={moneyBRL(kpis.receitaTotal)}
          trend={loading ? "Carregando..." : "Últimos lançamentos"}
          isPositive={true}
          loading={loading}
        />
        <StatCard
          title="Despesa Total"
          value={moneyBRL(kpis.despesaTotal)}
          trend={loading ? "Carregando..." : "Últimos lançamentos"}
          isPositive={false}
          loading={loading}
        />
        <StatCard
          title="Lucro"
          value={moneyBRL(kpis.lucro)}
          trend={loading ? "..." : `Margem ${kpis.margem}%`}
          isPositive={kpis.lucro >= 0}
          loading={loading}
        />
        <StatCard
          title="Estoque Crítico"
          value={String(kpis.itensCriticos)}
          trend={loading ? "..." : kpis.itensCriticos > 0 ? "Atenção" : "Ok"}
          isPositive={kpis.itensCriticos === 0 ? true : null}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Curva ABC (placeholder visual por enquanto) */}
        <Card className="lg:col-span-2 border-gray-100 rounded-[45px] bg-white shadow-xl overflow-hidden p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-orange-500" /> Curva ABC de Gastos
            </h3>
            <span className="text-[9px] font-black uppercase bg-gray-50 px-3 py-1 rounded-full text-gray-400 italic">
              Últimos 30 dias
            </span>
          </div>

          <div className="h-64 flex items-end gap-4 px-4">
            <div className="flex-1 bg-gradient-to-t from-orange-500 to-pink-500 rounded-t-2xl h-[90%] relative group">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                Proteínas
              </span>
            </div>
            <div className="flex-1 bg-gray-100 rounded-t-2xl h-[60%] hover:bg-orange-200 transition-colors" />
            <div className="flex-1 bg-gray-100 rounded-t-2xl h-[45%] hover:bg-orange-200 transition-colors" />
            <div className="flex-1 bg-gray-100 rounded-t-2xl h-[30%] hover:bg-orange-200 transition-colors" />
            <div className="flex-1 bg-gray-100 rounded-t-2xl h-[15%] hover:bg-orange-200 transition-colors" />
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">
            Próximo passo: vou ligar essa Curva ABC com seus lançamentos reais (Top categorias por gasto).
          </p>
        </Card>

        {/* Alertas IA (agora dinâmico vindo do hook) */}
        <Card className="border-gray-100 rounded-[45px] bg-gray-900 text-white shadow-xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Target size={120} />
          </div>

          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2 relative z-10">
            <AlertTriangle className="text-yellow-400" size={20} /> Alertas IA
          </h3>

          <div className="space-y-6 relative z-10">
            {loading ? (
              <div className="flex items-center gap-2 text-xs font-bold italic opacity-80">
                <Loader2 className="animate-spin" size={16} />
                Carregando insights...
              </div>
            ) : alertas.length === 0 ? (
              <AlertItem text="Nenhum alerta crítico agora. Tudo sob controle ✅" />
            ) : (
              alertas.slice(0, 4).map((a, idx) => (
                <AlertItem key={idx} text={a.texto} />
              ))
            )}
          </div>

          <Button className="w-full mt-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl h-14 font-black italic uppercase text-[10px] tracking-widest transition-all">
            Ver Todos os Insights <ArrowRight size={14} className="ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  isPositive,
  loading,
}: {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean | null;
  loading?: boolean;
}) {
  return (
    <Card className="border-gray-100 rounded-[35px] bg-white shadow-sm hover:shadow-lg transition-all p-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">
        {title}
      </p>

      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
        {loading ? "—" : value}
      </h4>

      <div
        className={`mt-4 flex items-center gap-1 text-[10px] font-black uppercase italic ${
          isPositive === null ? "text-gray-400" : isPositive ? "text-green-600" : "text-red-500"
        }`}
      >
        {isPositive !== null && (isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
        {trend}
      </div>
    </Card>
  );
}

function AlertItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-4 group cursor-pointer">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 group-hover:scale-150 transition-transform" />
      <p className="text-xs font-bold italic opacity-80 group-hover:opacity-100 transition-opacity leading-relaxed">
        {text}
      </p>
    </div>
  );
}
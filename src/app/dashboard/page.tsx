"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { useDashboard } from "@/react-app/hooks/useDashboard";
import { Card, CardContent } from "@/react-app/components/ui/card";
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
  Sparkles,
  Wallet,
  Package,
  Truck,
} from "lucide-react";

function moneyBRL(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type DashboardMode = "normal" | "estoque" | "financeiro" | "recebimento";

export default function DashboardPage() {
  const router = useRouter();
  const { localUser } = useAppAuth();
  const dashboard = useDashboard();

  const loading = dashboard?.loading ?? false;
  const error = dashboard?.error ?? null;
  const refresh = dashboard?.refresh ?? (() => {});
const rawKpis = dashboard?.kpis;

const kpis = {
  receitaTotal: rawKpis?.receitaTotal ?? 0,
  despesaTotal: rawKpis?.despesaTotal ?? 0,
  lucro: rawKpis?.lucro ?? 0,
  margem: rawKpis?.margem ?? 0,
  itensCriticos: rawKpis?.itensCriticos ?? 0,
  recebimentosPendentes:
    (rawKpis as typeof rawKpis & { recebimentosPendentes?: number })?.recebimentosPendentes ?? 0,
};
  const alertas = dashboard?.alertas ?? [];

  const dashboardMode: DashboardMode = useMemo(() => {
    if ((kpis.itensCriticos ?? 0) > 0) return "estoque";
    if ((kpis.lucro ?? 0) < 0) return "financeiro";
    if ((kpis.recebimentosPendentes ?? 0) > 0) return "recebimento";
    return "normal";
  }, [kpis.itensCriticos, kpis.lucro, kpis.recebimentosPendentes]);

  const heroCopy = useMemo(() => {
    switch (dashboardMode) {
      case "estoque":
        return {
          title: `Bom dia, ${localUser?.nome?.split(" ")[0] || "gestor"} 👋`,
          subtitle:
            "Alguns itens do seu estoque pedem atenção agora. O sistema já separou o que priorizar para você agir rápido.",
          cta: "Gerar lista inteligente",
          action: () => router.push("/app/lista-compras"),
        };
      case "financeiro":
        return {
          title: `Bom dia, ${localUser?.nome?.split(" ")[0] || "gestor"} 👋`,
          subtitle:
            "Seu financeiro pede atenção hoje. Vamos organizar as pendências e proteger o caixa da operação.",
          cta: "Revisar financeiro",
          action: () => router.push("/app/financeiro"),
        };
      case "recebimento":
        return {
          title: `Bom dia, ${localUser?.nome?.split(" ")[0] || "gestor"} 👋`,
          subtitle:
            "Existe uma entrega aguardando conferência. Resolver isso agora mantém estoque, compras e financeiro alinhados.",
          cta: "Conferir recebimento",
          action: () => router.push("/app/recebimento"),
        };
      default:
        return {
          title: `Bom dia, ${localUser?.nome?.split(" ")[0] || "gestor"} 👋`,
          subtitle:
            "Sua operação está caminhando bem hoje. Encontramos oportunidades para economizar e manter tudo sob controle.",
          cta: "Ver recomendações da IA",
          action: () => router.push("/app/assessor-ia"),
        };
    }
  }, [dashboardMode, localUser?.nome, router]);

  const fluxoLabel = useMemo(() => {
    if ((kpis.lucro ?? 0) < 0) {
      return {
        text: "Fluxo: Negativo",
        color: "bg-red-500",
        tone: "text-red-600",
      };
    }
    if ((kpis.itensCriticos ?? 0) > 0) {
      return {
        text: "Fluxo: Atenção",
        color: "bg-yellow-500",
        tone: "text-yellow-600",
      };
    }
    return {
      text: "Fluxo: Saudável",
      color: "bg-green-500",
      tone: "text-green-600",
    };
  }, [kpis.lucro, kpis.itensCriticos]);

  const progressoOperacao = useMemo(() => {
    const estoqueScore =
      (kpis.itensCriticos ?? 0) === 0 ? 92 : Math.max(35, 92 - kpis.itensCriticos * 18);

    const financeiroScore =
      (kpis.lucro ?? 0) >= 0
        ? 82
        : Math.max(30, 82 - Math.min(40, Math.abs(kpis.lucro) / 100));

    const recebimentoScore =
      (kpis.recebimentosPendentes ?? 0) === 0
        ? 90
        : Math.max(45, 90 - kpis.recebimentosPendentes * 20);

    return {
      estoque: estoqueScore,
      financeiro: financeiroScore,
      recebimentos: recebimentoScore,
    };
  }, [kpis.itensCriticos, kpis.lucro, kpis.recebimentosPendentes]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* HERO ACOLHEDOR */}
      <Card className="border-0 rounded-[40px] overflow-hidden bg-gradient-to-br from-gray-950 via-zinc-900 to-orange-950 text-white shadow-2xl">
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 mb-5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300 italic">
                  Painel Inteligente Ativo
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                {heroCopy.title}
              </h1>

              <p className="mt-5 text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
                {heroCopy.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={heroCopy.action}
                  className="bg-orange-600 hover:bg-orange-500 rounded-2xl h-14 px-7 text-xs md:text-sm font-black italic uppercase tracking-wider shadow-xl shadow-orange-950/40"
                >
                  {heroCopy.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <Button
                  onClick={refresh}
                  variant="outline"
                  className="rounded-2xl h-14 px-5 gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RefreshCcw size={16} />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest italic">
                    Atualizar painel
                  </span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-full xl:min-w-[430px]">
              <MiniPulseCard
                icon={<Package className="w-4 h-4" />}
                label="Estoque"
                value={`${kpis.itensCriticos ?? 0} críticos`}
              />
              <MiniPulseCard
                icon={<Wallet className="w-4 h-4" />}
                label="Lucro"
                value={moneyBRL(kpis.lucro ?? 0)}
              />
              <MiniPulseCard
                icon={<Truck className="w-4 h-4" />}
                label="Recebimentos"
                value={`${kpis.recebimentosPendentes ?? 0} pendentes`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TOPO OPERACIONAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            Painel Estratégico
          </h2>
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
        </div>
      </div>

      {/* ERRO */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
          <p className="text-sm font-bold">Erro ao carregar dashboard: {error}</p>
        </div>
      )}

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={moneyBRL(kpis.receitaTotal ?? 0)}
          trend={loading ? "Carregando..." : "Últimos lançamentos"}
          isPositive={true}
          loading={loading}
        />
        <StatCard
          title="Despesa Total"
          value={moneyBRL(kpis.despesaTotal ?? 0)}
          trend={loading ? "Carregando..." : "Últimos lançamentos"}
          isPositive={false}
          loading={loading}
        />
        <StatCard
          title="Lucro"
          value={moneyBRL(kpis.lucro ?? 0)}
          trend={loading ? "..." : `Margem ${kpis.margem ?? 0}%`}
          isPositive={(kpis.lucro ?? 0) >= 0}
          loading={loading}
        />
        <StatCard
          title="Estoque Crítico"
          value={String(kpis.itensCriticos ?? 0)}
          trend={
            loading
              ? "..."
              : (kpis.itensCriticos ?? 0) > 0
                ? "Atenção imediata"
                : "Operação estável"
          }
          isPositive={(kpis.itensCriticos ?? 0) === 0 ? true : null}
          loading={loading}
        />
      </div>

      {/* FAIXA DE PROGRESSO */}
      <Card className="border-gray-100 rounded-[35px] bg-white shadow-sm p-8">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">
                Progresso da Operação
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Um retrato rápido do quanto sua casa está organizada hoje.
              </p>
            </div>

            <p className={`text-xs font-black uppercase italic ${fluxoLabel.tone}`}>
              {dashboardMode === "estoque" && "Prioridade de hoje: proteger o estoque"}
              {dashboardMode === "financeiro" && "Prioridade de hoje: proteger o caixa"}
              {dashboardMode === "recebimento" && "Prioridade de hoje: concluir conferências"}
              {dashboardMode === "normal" && "Prioridade de hoje: aproveitar oportunidades"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProgressMetric
              label="Estoque revisado"
              value={progressoOperacao.estoque}
              barClass="bg-green-500"
            />
            <ProgressMetric
              label="Financeiro organizado"
              value={progressoOperacao.financeiro}
              barClass="bg-purple-500"
            />
            <ProgressMetric
              label="Recebimentos conferidos"
              value={progressoOperacao.recebimentos}
              barClass="bg-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CURVA ABC */}
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
            Próximo passo: ligar essa Curva ABC com seus lançamentos reais para mostrar as categorias com maior impacto financeiro.
          </p>
        </Card>

        {/* ALERTAS IA */}
        <Card className="border-gray-100 rounded-[45px] bg-gray-900 text-white shadow-xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Target size={120} />
          </div>

          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-3 flex items-center gap-2 relative z-10">
            <AlertTriangle className="text-yellow-400" size={20} /> Alertas IA
          </h3>

          <p className="text-xs text-zinc-400 mb-8 relative z-10">
            O sistema cruzou sinais da operação e separou o que mais merece sua atenção.
          </p>

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

          <Button
            onClick={() => router.push("/app/assessor-ia")}
            className="w-full mt-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl h-14 font-black italic uppercase text-[10px] tracking-widest transition-all"
          >
            Ver Todos os Insights <ArrowRight size={14} className="ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function MiniPulseCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 text-orange-300 mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
          {label}
        </span>
      </div>
      <p className="text-lg font-black italic uppercase tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  barClass,
}: {
  label: string;
  value: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <span className="text-xs font-black uppercase italic text-gray-500">
          {value}%
        </span>
      </div>
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div className={`h-3 rounded-full ${barClass}`} style={{ width: `${value}%` }} />
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
      <CardContent className="p-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">
          {title}
        </p>

        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
          {loading ? "—" : value}
        </h4>

        <div
          className={`mt-4 flex items-center gap-1 text-[10px] font-black uppercase italic ${
            isPositive === null
              ? "text-gray-400"
              : isPositive
                ? "text-green-600"
                : "text-red-500"
          }`}
        >
          {isPositive !== null &&
            (isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
          {trend}
        </div>
      </CardContent>
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
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  Check,
  AlertTriangle,
  Brain,
  Package,
  ShoppingCart,
  Wallet,
  Sparkles,
  Activity,
  BadgeAlert,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { getEmpresaId } from "@/react-app/lib/empresa";

const LOGO_URL = "/logo.png";

interface FinanceiroDashboard {
  pagarHoje: number;
  pagar7Dias: number;
  pagarAtrasado: number;
  totalPendente: number;
  totalPago: number;
  totalLancamentos: number;
  totalBoletos: number;
  totalNotas: number;
  semBoleto: number;
  divergencias: number;
  ticketMedioSaida: number;
}

interface CmvData {
  faturamento: number;
  custoTotal: number;
  lucro: number;
  cmv: number;
}

interface FluxoDia {
  data: string;
  entradas: number;
  saidas_previstas: number;
  saidas_pagas: number;
  saldo_dia: number;
  saldo_acumulado: number;
}

interface InsightAlert {
  id: string;
  title: string;
  description: string;
  level: "critico" | "atencao" | "ok";
  value?: number;
  href?: string;
}

interface FinanceiroInsights {
  summary: string;
  deterministicSummary: string;
  alerts: InsightAlert[];
  actions: Array<{
    title: string;
    description: string;
    href: string;
  }>;
  aiEnabled: boolean;
}

interface EstoqueItem {
  id: string;
  produto_id: string;
  produto_nome: string;
  categoria_produto: string | null;
  unidade_medida: string;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ponto_reposicao: number | null;
  custo_medio: number;
  valor_estoque: number;
  abaixo_minimo: boolean;
  abaixo_ponto_reposicao: boolean;
}

interface DashboardCategoria {
  categoria: string;
  quantidade: number;
  valor_previsto: number;
  valor_pago: number;
}

interface SugestaoIA {
  id: string;
  tipo: "estoque" | "cotacao" | "unidade" | "economia" | "processo";
  titulo: string;
  detalhe: string;
  acao?: { label: string };
}

interface DashboardState {
  financeiro: FinanceiroDashboard | null;
  cmv: CmvData | null;
  fluxo: FluxoDia[];
  insights: FinanceiroInsights | null;
  estoque: EstoqueItem[];
  porCategoria: DashboardCategoria[];
  sugestoes: SugestaoIA[];
}

const COLORS = ["#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6"];

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatCompactCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatPercent(value?: number | null) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function shortDate(value: string) {
  const dt = new Date(`${value}T00:00:00`);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function tooltipMoneyFormatter(value: unknown) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : Array.isArray(value)
      ? Number(value[0] ?? 0)
      : 0;

  return formatCurrency(numericValue);
}

async function getJson<T>(url: string, empresaId?: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  if (empresaId) {
    headers.set("x-empresa-id", empresaId);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}`);
  }

  return (await response.json()) as T;
}

function buildAiHealthScore(params: {
  cmv: CmvData | null;
  financeiro: FinanceiroDashboard | null;
  estoqueCriticoCount: number;
  insights: FinanceiroInsights | null;
}) {
  let score = 100;

  const cmv = Number(params.cmv?.cmv || 0);
  const atrasado = Number(params.financeiro?.pagarAtrasado || 0);
  const pendente = Number(params.financeiro?.totalPendente || 0);
  const criticos = Number(params.estoqueCriticoCount || 0);
  const alertasCriticos =
    params.insights?.alerts?.filter((item) => item.level === "critico").length || 0;
  const alertasAtencao =
    params.insights?.alerts?.filter((item) => item.level === "atencao").length || 0;

  if (cmv > 45) score -= 18;
  else if (cmv > 35) score -= 10;
  else if (cmv > 25) score -= 4;

  if (atrasado > 0) score -= 15;
  if (pendente > 20) score -= 10;
  else if (pendente > 10) score -= 5;

  if (criticos >= 10) score -= 18;
  else if (criticos >= 5) score -= 10;
  else if (criticos >= 1) score -= 4;

  score -= alertasCriticos * 8;
  score -= alertasAtencao * 3;

  return Math.max(0, Math.min(100, score));
}

function buildAiParticipation(params: {
  insights: FinanceiroInsights | null;
  sugestoes: SugestaoIA[];
  estoqueCriticoCount: number;
  fluxoCount: number;
}) {
  let score = 28;

  if (params.insights?.summary) score += 8;
  if ((params.insights?.alerts?.length || 0) > 0) score += 8;
  if ((params.insights?.actions?.length || 0) > 0) score += 8;
  if ((params.sugestoes?.length || 0) > 0) score += 12;
  if (params.estoqueCriticoCount > 0) score += 6;
  if (params.fluxoCount > 0) score += 4;

  return Math.max(0, Math.min(100, score));
}

function buildRiskLabel(score: number) {
  if (score >= 80) return { label: "Operação forte", color: "text-green-600" };
  if (score >= 60) return { label: "Operação estável", color: "text-amber-600" };
  return { label: "Operação em atenção", color: "text-red-600" };
}

export default function DashboardPage() {
  const { localUser, loading: authLoading } = useAppAuth();

  const [data, setData] = useState<DashboardState>({
    financeiro: null,
    cmv: null,
    fluxo: [],
    insights: null,
    estoque: [],
    porCategoria: [],
    sugestoes: [],
  });
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const empresaId = localUser?.empresa_id || getEmpresaId() || null;

  const fetchDashboard = useCallback(async () => {
    if (!empresaId) {
      setData({
        financeiro: null,
        cmv: null,
        fluxo: [],
        insights: null,
        estoque: [],
        porCategoria: [],
        sugestoes: [],
      });
      setDashboardError("Empresa não selecionada. Finalize o onboarding ou selecione uma empresa ativa.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setDashboardError(null);

      const [dashboardRes, financeiroRes, cmvRes, fluxoRes, insightsRes, estoqueRes] =
        await Promise.allSettled([
          getJson<{ totais?: unknown; porCategoria?: unknown }>("/api/dashboard", empresaId),
          getJson<FinanceiroDashboard>("/api/financeiro/dashboard", empresaId),
          getJson<CmvData>("/api/financeiro/cmv", empresaId),
          getJson<FluxoDia[]>("/api/financeiro/fluxo-caixa?days=14", empresaId),
          getJson<FinanceiroInsights>("/api/financeiro/insights", empresaId),
          getJson<EstoqueItem[]>("/api/estoque", empresaId),
        ]);

      const dashboardData =
        dashboardRes.status === "fulfilled"
          ? dashboardRes.value
          : { totais: undefined, porCategoria: [] };

      const porCategoria = Array.isArray(dashboardData?.porCategoria)
        ? dashboardData.porCategoria.map((cat: any) => ({
            categoria: String(cat?.categoria || "Sem categoria"),
            quantidade: Number(cat?.quantidade || 0),
            valor_previsto: Number(cat?.valor_previsto || 0),
            valor_pago: Number(cat?.valor_pago || 0),
          }))
        : [];

      let sugestoes: SugestaoIA[] = [];

      try {
        const sugestoesRes = await getJson<{ sugestoes: SugestaoIA[] }>(
          "/api/ia/sugestoes-compras",
          empresaId,
          {
            method: "POST",
            body: JSON.stringify({
              itens: [],
              estoqueBaixo:
                estoqueRes.status === "fulfilled"
                  ? safeArray<EstoqueItem>(estoqueRes.value).filter(
                      (item) => item.abaixo_minimo || item.abaixo_ponto_reposicao
                    )
                  : [],
              fornecedores: [],
              produtos: [],
            }),
          }
        );

        sugestoes = safeArray<SugestaoIA>(sugestoesRes?.sugestoes);
      } catch {
        sugestoes = [];
      }

      setData({
        financeiro: financeiroRes.status === "fulfilled" ? financeiroRes.value : null,
        cmv: cmvRes.status === "fulfilled" ? cmvRes.value : null,
        fluxo: fluxoRes.status === "fulfilled" ? safeArray<FluxoDia>(fluxoRes.value) : [],
        insights: insightsRes.status === "fulfilled" ? insightsRes.value : null,
        estoque: estoqueRes.status === "fulfilled" ? safeArray<EstoqueItem>(estoqueRes.value) : [],
        porCategoria,
        sugestoes,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setDashboardError("Não foi possível carregar o dashboard desta empresa.");
      setData({
        financeiro: null,
        cmv: null,
        fluxo: [],
        insights: null,
        estoque: [],
        porCategoria: [],
        sugestoes: [],
      });
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (authLoading) return;
    void fetchDashboard();
  }, [authLoading, fetchDashboard]);

  const estoqueCritico = useMemo(
    () => data.estoque.filter((item) => item.abaixo_minimo || item.abaixo_ponto_reposicao),
    [data.estoque]
  );

  const topGiro = useMemo(() => {
    return [...data.estoque]
      .map((item) => {
        const referencia = Math.max(item.estoque_minimo || 0, item.ponto_reposicao || 0, 1);
        const deficit = Math.max(referencia - item.quantidade_atual, 0);
        const giroScore = deficit / referencia;

        return {
          ...item,
          giroScore,
        };
      })
      .sort((a, b) => b.giroScore - a.giroScore || a.quantidade_atual - b.quantidade_atual)
      .slice(0, 5);
  }, [data.estoque]);

  const fluxoChart = useMemo(() => {
    if (data.fluxo.length > 0) {
      return data.fluxo.map((item) => ({
        ...item,
        label: shortDate(item.data),
      }));
    }

    const faturamento = Number(data.cmv?.faturamento || 0);
    const compras = Number(data.cmv?.custoTotal || 0);
    const mediaVenda = faturamento / 7;
    const mediaCompra = compras / 7;

    return Array.from({ length: 7 }).map((_, index) => ({
      label: `${index + 1}/03`,
      entradas: mediaVenda,
      saidas_previstas: mediaCompra,
      saldo_acumulado: (index + 1) * (mediaVenda - mediaCompra),
    }));
  }, [data.cmv, data.fluxo]);

  const pieData = data.porCategoria.map((cat) => ({
    name: cat.categoria || "Sem categoria",
    value: Number(cat.valor_previsto || 0),
  }));

  const barData = data.porCategoria.map((cat) => ({
    categoria: String(cat.categoria || "Sem categoria").substring(0, 10),
    previsto: Number(cat.valor_previsto || 0),
    pago: Number(cat.valor_pago || 0),
  }));

  const comprasVsVendas =
    Number(data.cmv?.faturamento || 0) > 0
      ? (Number(data.cmv?.custoTotal || 0) / Number(data.cmv?.faturamento || 1)) * 100
      : 0;

  const previsaoFinal =
    fluxoChart.length > 0 ? Number(fluxoChart[fluxoChart.length - 1]?.saldo_acumulado || 0) : 0;

  const melhorSugestao = data.sugestoes[0];
  const principalInsight = data.insights?.alerts?.[0];

  const aiHealthScore = buildAiHealthScore({
    cmv: data.cmv,
    financeiro: data.financeiro,
    estoqueCriticoCount: estoqueCritico.length,
    insights: data.insights,
  });

  const aiParticipation = buildAiParticipation({
    insights: data.insights,
    sugestoes: data.sugestoes,
    estoqueCriticoCount: estoqueCritico.length,
    fluxoCount: data.fluxo.length,
  });

  const riskLabel = buildRiskLabel(aiHealthScore);

  const aiExecutiveSummary = useMemo(() => {
    if (data.insights?.summary) return data.insights.summary;

    const parts: string[] = [];

    if (Number(data.cmv?.faturamento || 0) > 0) {
      parts.push(`faturamento atual em ${formatCurrency(data.cmv?.faturamento)}`);
    }

    if (Number(data.cmv?.cmv || 0) > 0) {
      parts.push(`CMV em ${formatPercent(data.cmv?.cmv)}`);
    }

    if (estoqueCritico.length > 0) {
      parts.push(`${estoqueCritico.length} itens em estoque crítico`);
    }

    if (Number(data.financeiro?.pagarAtrasado || 0) > 0) {
      parts.push(`há valores atrasados no financeiro`);
    }

    if (parts.length === 0) {
      return "A Pappi IA ainda está montando a leitura executiva. Conforme mais dados entrarem no sistema, o diagnóstico fica mais inteligente.";
    }

    return `A Pappi IA identificou ${parts.join(", ")}. Priorize caixa, estoque e compras para proteger margem e previsibilidade.`;
  }, [data.cmv, data.financeiro, data.insights, estoqueCritico.length]);

  const aiOpportunities = useMemo(() => {
    const opportunities: string[] = [];

    if (comprasVsVendas > 45) {
      opportunities.push("Reduzir custo de compra para aliviar pressão sobre a margem.");
    } else {
      opportunities.push("A relação compras vs vendas está em faixa melhor, com espaço para ganho de escala.");
    }

    if (estoqueCritico.length > 0) {
      opportunities.push("Reposição orientada por prioridade para evitar ruptura e venda perdida.");
    } else {
      opportunities.push("Estoque sem ruptura crítica imediata, permitindo compras mais estratégicas.");
    }

    if (Number(data.financeiro?.pagarAtrasado || 0) > 0) {
      opportunities.push("Atacar contas vencidas primeiro para melhorar previsibilidade do caixa.");
    } else {
      opportunities.push("Financeiro sem vencidos relevantes no momento, favorecendo organização do fluxo.");
    }

    return opportunities.slice(0, 3);
  }, [comprasVsVendas, estoqueCritico.length, data.financeiro?.pagarAtrasado]);

  const aiPriorityAction = useMemo(() => {
    if (melhorSugestao?.titulo) return melhorSugestao.titulo;
    if (data.insights?.actions?.[0]?.title) return data.insights.actions[0].title;

    if (estoqueCritico.length > 0) {
      return "Corrigir primeiro os itens com risco de ruptura.";
    }

    if (Number(data.financeiro?.pagarAtrasado || 0) > 0) {
      return "Atacar pagamentos atrasados para estabilizar o caixa.";
    }

    if (comprasVsVendas > 40) {
      return "Revisar custo de compras para melhorar margem.";
    }

    return "Expandir a leitura da Pappi IA com mais histórico de vendas, compras e estoque.";
  }, [
    melhorSugestao?.titulo,
    data.insights?.actions,
    estoqueCritico.length,
    data.financeiro?.pagarAtrasado,
    comprasVsVendas,
  ]);

  const aiStockInterpretation = useMemo(() => {
    if (estoqueCritico.length >= 8) {
      return "A Pappi IA detecta risco alto de ruptura. Reposição imediata pode proteger venda e experiência do cliente.";
    }
    if (estoqueCritico.length >= 3) {
      return "Há itens sensíveis no estoque. Vale priorizar compra por impacto e giro.";
    }
    return "Estoque relativamente estável. Existe espaço para compras mais estratégicas e menos reativas.";
  }, [estoqueCritico.length]);

  const aiMarginInterpretation = useMemo(() => {
    if (comprasVsVendas > 50) {
      return "A pressão de compras sobre vendas está alta. A Pappi IA sugere revisar fornecedores, mix e desperdício.";
    }
    if (comprasVsVendas > 35) {
      return "A relação compras vs vendas está em atenção moderada. Ainda há espaço para ganho de margem.";
    }
    return "A relação compras vs vendas está melhor equilibrada, favorecendo rentabilidade.";
  }, [comprasVsVendas]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!empresaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-amber-100 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Pappi Gestor" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="font-bold text-gray-800 dark:text-white">Pappi Gestor</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard Executivo</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-12">
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/80">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Empresa não selecionada
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Finalize o onboarding ou vincule seu usuário a uma empresa para carregar o dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/onboarding">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Finalizar onboarding
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => void fetchDashboard()}>
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-amber-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>

            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Pappi Gestor" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="font-bold text-gray-800 dark:text-white">Pappi Gestor</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard Executivo</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white">SaaS</Badge>
            {data.insights?.aiEnabled ? (
              <Badge className="bg-fuchsia-600 hover:bg-fuchsia-600 text-white">Pappi IA ativa</Badge>
            ) : (
              <Badge variant="outline">Pappi IA local</Badge>
            )}
            <Badge variant="outline" className="border-fuchsia-200 text-fuchsia-700">
              Pappi IA ~ {aiParticipation}%
            </Badge>
            <Button
              variant="outline"
              className="border-amber-200 bg-white/80 hover:bg-amber-50"
              onClick={() => void fetchDashboard()}
            >
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {dashboardError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dashboardError}
          </div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <p className="text-sm text-white/85">Pappi IA</p>
              </div>
              <h2 className="text-2xl font-bold mb-2">Inteligência operacional do seu negócio</h2>
              <p className="text-sm text-white/90 leading-6">{aiExecutiveSummary}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Previsão de caixa</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCompactCurrency(previsaoFinal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Saldo projetado com base em entradas e saídas previstas.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Score Pappi IA</p>
                  <p className="text-3xl font-bold text-fuchsia-600">{aiHealthScore}%</p>
                  <p className={`text-xs mt-2 font-medium ${riskLabel.color}`}>{riskLabel.label}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 flex items-center justify-center">
                  <Activity className="w-7 h-7 text-fuchsia-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {data.financeiro?.totalLancamentos || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lançamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">
                    {data.financeiro?.totalPendente || 0}
                  </p>
                  <p className="text-xs text-blue-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-800">
                    {data.financeiro?.totalPago || 0}
                  </p>
                  <p className="text-xs text-green-600">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-800">{estoqueCritico.length}</p>
                  <p className="text-xs text-red-600">Estoque crítico</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Faturamento</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(data.cmv?.faturamento)}
                  </p>
                </div>
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Compras vs vendas</p>
                  <p className="text-3xl font-bold text-green-600">{formatPercent(comprasVsVendas)}</p>
                </div>
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">{aiMarginInterpretation}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">CMV</p>
                  <p className="text-3xl font-bold text-fuchsia-600">{formatPercent(data.cmv?.cmv)}</p>
                </div>
                <div className="w-14 h-14 bg-fuchsia-100 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-fuchsia-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lucro bruto</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.cmv?.lucro)}</p>
                </div>
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-lg xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fluxoChart}>
                    <defs>
                      <linearGradient id="faturamentoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => formatCompactCurrency(Number(v))} />
                    <Tooltip formatter={tooltipMoneyFormatter} />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      stroke="#f97316"
                      fill="url(#faturamentoGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-fuchsia-600" />
                Diagnóstico Pappi IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/70 p-3">
                <p className="text-xs text-fuchsia-700 font-medium mb-1">Prioridade agora</p>
                <p className="text-sm text-gray-800">{aiPriorityAction}</p>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-3">
                <p className="text-xs text-orange-700 font-medium mb-1">Leitura operacional</p>
                <p className="text-sm text-gray-800">
                  {principalInsight?.description ||
                    "A Pappi IA ainda está consolidando padrões. Quanto mais histórico, mais precisa fica a leitura."}
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Participação da Pappi IA</p>
                <p className="text-sm text-gray-800">
                  Aproximadamente <strong>{aiParticipation}%</strong> da experiência desta página já é orientada por IA.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Previsão de caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => formatCompactCurrency(Number(v))} />
                    <Tooltip formatter={tooltipMoneyFormatter} />
                    <Line
                      type="monotone"
                      dataKey="saldo_acumulado"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Oportunidades da Pappi IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiOpportunities.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-xl border border-orange-100 bg-white p-3">
                  <p className="text-sm text-gray-800">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipMoneyFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Previsto vs Pago</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`}
                      />
                      <YAxis type="category" dataKey="categoria" width={80} />
                      <Tooltip formatter={tooltipMoneyFormatter} />
                      <Legend />
                      <Bar dataKey="previsto" fill="#f97316" name="Previsto" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="pago" fill="#22c55e" name="Pago" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-lg xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Produtos que mais giram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topGiro.length > 0 ? (
                topGiro.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-orange-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white truncate">
                          {index + 1}. {item.produto_nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          Atual: {item.quantidade_atual} {item.unidade_medida} • mín.: {item.estoque_minimo}
                        </p>
                      </div>
                      <Badge variant="outline">{Math.round(item.giroScore * 100)}%</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">Sem dados para exibir</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BadgeAlert className="w-5 h-5 text-red-500" />
                Alerta de estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                <p className="text-xs text-red-700 font-medium mb-1">Leitura da Pappi IA</p>
                <p className="text-sm text-gray-800">{aiStockInterpretation}</p>
              </div>

              {estoqueCritico.length > 0 ? (
                estoqueCritico.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="font-medium text-gray-800">{item.produto_nome}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Atual {item.quantidade_atual} {item.unidade_medida} • mínimo {item.estoque_minimo}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                  Nenhum item crítico agora.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-fuchsia-600" />
                Recomendação da Pappi IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 via-white to-orange-50 border border-fuchsia-100 p-4">
                <p className="font-semibold text-gray-900">
                  {melhorSugestao?.titulo ||
                    data.insights?.actions?.[0]?.title ||
                    "Conecte compras, estoque e financeiro para decisões mais inteligentes."}
                </p>
                <p className="text-sm text-gray-600 mt-2 leading-6">
                  {melhorSugestao?.detalhe ||
                    data.insights?.actions?.[0]?.description ||
                    "Seu dashboard já está pronto para evoluir sem perder o visual comercial do Pappi."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {(data.sugestoes.length > 1 ? data.sugestoes.slice(1, 3) : []).map((sugestao) => (
                  <div key={sugestao.id} className="rounded-xl border border-orange-100 p-3">
                    <p className="font-medium text-gray-900">{sugestao.titulo}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-5">{sugestao.detalhe}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Qtd</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Previsto</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Pago</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {data.porCategoria.map((cat, i) => (
                    <tr
                      key={`${cat.categoria}-${i}`}
                      className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {cat.categoria}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{cat.quantidade}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(cat.valor_previsto)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(cat.valor_pago)}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={
                            cat.valor_previsto - cat.valor_pago >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(cat.valor_previsto - cat.valor_pago)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {data.porCategoria.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Sem dados para exibir
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Link href="/app/financeiro">
            <Card className="border-0 shadow-lg hover:shadow-xl transition cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Financeiro</p>
                  <p className="text-xs text-gray-500">Fluxo, contas e pagamentos</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/app/estoque">
            <Card className="border-0 shadow-lg hover:shadow-xl transition cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Estoque</p>
                  <p className="text-xs text-gray-500">Controle e rupturas</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/app/lista-compras">
            <Card className="border-0 shadow-lg hover:shadow-xl transition cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Lista de compras</p>
                  <p className="text-xs text-gray-500">Reposição e cotação</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/app/assessor-ia">
            <Card className="border-0 shadow-lg hover:shadow-xl transition cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Pappi IA</p>
                  <p className="text-xs text-gray-500">Recomendações e insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}

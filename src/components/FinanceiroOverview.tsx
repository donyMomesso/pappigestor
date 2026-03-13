"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Badge } from "@/react-app/components/ui/badge";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  FileWarning,
  Landmark,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type DashboardResumo = {
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
};

type InsightAlert = {
  id: string;
  title: string;
  description: string;
  level: "critico" | "atencao" | "ok";
  value?: number;
  href?: string;
};

type FinanceiroInsights = {
  summary: string;
  deterministicSummary?: string;
  alerts: InsightAlert[];
  actions: Array<{ title: string; description: string; href: string }>;
  topCategorias: Array<{ categoria: string; total: number }>;
  aiEnabled: boolean;
};

type FluxoBucket = {
  data: string;
  entradas: number;
  saidas_previstas: number;
  saidas_pagas: number;
  saldo_dia: number;
  saldo_acumulado: number;
};

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function levelClasses(level: InsightAlert["level"]) {
  if (level === "critico") return "border-red-200 bg-red-50 text-red-700";
  if (level === "atencao") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function FinanceiroOverview({ compact = false }: { compact?: boolean }) {
  const { localUser } = useAppAuth();
  const [dashboard, setDashboard] = useState<DashboardResumo | null>(null);
  const [insights, setInsights] = useState<FinanceiroInsights | null>(null);
  const [fluxo, setFluxo] = useState<FluxoBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const empresaId =
    localUser?.empresa_id ||
    (typeof window !== "undefined" ? localStorage.getItem("empresa_id") : "") ||
    (typeof window !== "undefined" ? localStorage.getItem("pId") : "") ||
    "";

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!empresaId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers = { "x-empresa-id": empresaId };
        const [dashboardRes, insightsRes, fluxoRes] = await Promise.all([
          fetch("/api/financeiro/dashboard", { headers, cache: "no-store" }),
          fetch("/api/financeiro/insights", { headers, cache: "no-store" }),
          fetch("/api/financeiro/fluxo-caixa?days=15", { headers, cache: "no-store" }),
        ]);

        if (ignore) return;

        const [dashboardJson, insightsJson, fluxoJson] = await Promise.all([
          dashboardRes.ok ? dashboardRes.json() : null,
          insightsRes.ok ? insightsRes.json() : null,
          fluxoRes.ok ? fluxoRes.json() : [],
        ]);

        setDashboard(dashboardJson);
        setInsights(insightsJson);
        setFluxo(Array.isArray(fluxoJson) ? fluxoJson : []);
      } catch (error) {
        console.error("Erro ao carregar overview financeiro:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [empresaId]);

  const fluxoResumo = useMemo(() => {
    if (!fluxo.length) return { piorSaldo: 0, proxSaidas: 0, proxEntradas: 0 };
    return fluxo.reduce(
      (acc, item, index) => {
        acc.piorSaldo = Math.min(acc.piorSaldo, item.saldo_acumulado);
        if (index < 7) {
          acc.proxSaidas += item.saidas_previstas;
          acc.proxEntradas += item.entradas;
        }
        return acc;
      },
      { piorSaldo: fluxo[0]?.saldo_acumulado || 0, proxSaidas: 0, proxEntradas: 0 }
    );
  }, [fluxo]);

  const cards = [
    {
      label: "Pagar hoje",
      value: formatCurrency(dashboard?.pagarHoje),
      helper: "Contas com vencimento no dia",
      icon: CalendarClock,
    },
    {
      label: "Atrasado",
      value: formatCurrency(dashboard?.pagarAtrasado),
      helper: "Títulos já vencidos",
      icon: AlertTriangle,
    },
    {
      label: "Próximos 7 dias",
      value: formatCurrency(dashboard?.pagar7Dias),
      helper: "Saídas previstas no curto prazo",
      icon: CircleDollarSign,
    },
    {
      label: "Sem boleto",
      value: String(dashboard?.semBoleto || 0),
      helper: "Compras ainda sem documento financeiro",
      icon: FileWarning,
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: compact ? 4 : 8 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-zinc-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{card.value}</div>
                    <p className="mt-1 text-xs text-zinc-500">{card.helper}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-100 p-3 text-zinc-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!compact && (
        <div className="grid gap-4 xl:grid-cols-[1.3fr,0.9fr]">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-lg">Leitura rápida do caixa</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">
                  Projeção baseada nos próximos 15 dias do seu fluxo.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/financeiro/fluxo-caixa">
                  Ver fluxo completo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <TrendingUp className="h-4 w-4" />
                  Próximas saídas
                </div>
                <div className="text-xl font-bold text-zinc-900">{formatCurrency(fluxoResumo.proxSaidas)}</div>
                <p className="mt-1 text-xs text-zinc-500">Soma das saídas previstas nos próximos 7 dias.</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <Landmark className="h-4 w-4" />
                  Próximas entradas
                </div>
                <div className="text-xl font-bold text-zinc-900">{formatCurrency(fluxoResumo.proxEntradas)}</div>
                <p className="mt-1 text-xs text-zinc-500">Entradas previstas que equilibram o caixa.</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <CreditCard className="h-4 w-4" />
                  Pior saldo projetado
                </div>
                <div className="text-xl font-bold text-zinc-900">{formatCurrency(fluxoResumo.piorSaldo)}</div>
                <p className="mt-1 text-xs text-zinc-500">Menor saldo acumulado esperado na janela atual.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Resumo inteligente</CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">
                    {insights?.aiEnabled ? "Com apoio de IA configurada" : "Com análise automática por regras"}
                  </p>
                </div>
                <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">
                  <Brain className="mr-1 h-3.5 w-3.5" />
                  {insights?.aiEnabled ? "IA ativa" : "IA opcional"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                {insights?.summary || "Sem resumo disponível no momento."}
              </div>
              <div className="space-y-3">
                {(insights?.alerts || []).slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`rounded-2xl border p-3 ${levelClasses(alert.level)}`}>
                    <div className="font-semibold">{alert.title}</div>
                    <p className="mt-1 text-sm opacity-90">{alert.description}</p>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/app/financeiro/insights">
                  Abrir central de insights
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!compact && insights?.actions?.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {insights.actions.map((action) => (
            <Card key={action.title} className="border-zinc-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Próxima ação
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-zinc-900">{action.title}</h3>
                <p className="mt-2 min-h-[52px] text-sm leading-6 text-zinc-600">{action.description}</p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href={action.href}>
                    Ir agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

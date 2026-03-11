// src/hooks/useDashboard.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { useApi } from "@/hooks/useApi";

type MesSerie = { name: string; receitas: number; despesas: number };
type EstoquePizza = { name: string; value: number };

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seriesMensal, setSeriesMensal] = useState<MesSerie[]>([]);
  const [estoquePizza, setEstoquePizza] = useState<EstoquePizza[]>([]);
  const [itensCriticos, setItensCriticos] = useState<
    Array<{ id?: string; nome: string; atual: number; minimo: number }>
  >([]);

  const [kpis, setKpis] = useState({
    receitaTotal: 0,
    despesaTotal: 0,
    lucro: 0,
    margem: 0,
    itensCriticos: 0,
    recebimentosPendentes: 0,
  });

  // tick para forçar recomputação quando chamar refresh()
  const [tick, setTick] = useState(0);

  // Consome múltiplos endpoints via useApi
  const { data: financeiro, error: finErr } = useApi<any[]>("/api/financeiro");
  const { data: produtos, error: prodErr } = useApi<any[]>("/api/produtos");
  const { data: recebimentos, error: recErr } = useApi<any[]>("/api/recebimentos");

  // refresh exposto para o componente
  async function refresh() {
    // incrementa tick para forçar o efeito
    setTick((t) => t + 1);
  }

  useEffect(() => {
    let mounted = true;
    async function compute() {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      try {
        if (finErr || prodErr || recErr) {
          throw new Error(finErr || prodErr || recErr || "Erro ao carregar dados");
        }

        const finRows = financeiro || [];
        const prodRows = produtos || [];
        const recebRows = recebimentos || [];

        // KPIs básicos
        const receitaTotal = finRows
          .filter((t) => String(t.tipo || "").toLowerCase() === "receita")
          .reduce((acc, t) => acc + Number(t.valor || 0), 0);

        const despesaTotal = finRows
          .filter((t) => String(t.tipo || "").toLowerCase() === "despesa")
          .reduce((acc, t) => acc + Number(t.valor || 0), 0);

        const lucro = receitaTotal - despesaTotal;
        const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0;

        // Estoque crítico
        const criticos = prodRows
          .map((p) => ({
            id: p.id,
            nome: String(p.nome ?? "Item"),
            atual: Number(p.estoque_atual || 0),
            minimo: Number(p.estoque_minimo || 0),
          }))
          .filter((p) => p.minimo > 0 && p.atual <= p.minimo)
          .slice(0, 8);

        const totalOk = prodRows.filter((p) => {
          const a = Number(p.estoque_atual || 0);
          const m = Number(p.estoque_minimo || 0);
          return m <= 0 || a > m;
        }).length;

        const totalCrit = Math.max(0, prodRows.length - totalOk);

        const totalRecebimentosPendentes = recebRows.filter((r) => {
          const status = String(r.status ?? "").toLowerCase().trim();
          return (
            status === "pendente" ||
            status === "aguardando" ||
            status === "em_aberto" ||
            status === "aberto" ||
            r.conferido === false ||
            !r.data_recebimento
          );
        }).length;

        setSeriesMensal([
          { name: "Jan", receitas: receitaTotal / 6, despesas: despesaTotal / 6 },
          { name: "Fev", receitas: receitaTotal / 6, despesas: despesaTotal / 6 },
          { name: "Mar", receitas: receitaTotal / 6, despesas: despesaTotal / 6 },
          { name: "Abr", receitas: receitaTotal / 6, despesas: despesaTotal / 6 },
          { name: "Mai", receitas: receitaTotal / 6, despesas: despesaTotal / 6 },
          { name: "Jun", receitas: receitaTotal / 6, despesas: despesaTotal / 6 },
        ]);

        setItensCriticos(criticos);
        setEstoquePizza([
          { name: "Ok", value: totalOk },
          { name: "Crítico", value: totalCrit },
        ]);

        setKpis({
          receitaTotal,
          despesaTotal,
          lucro,
          margem,
          itensCriticos: totalCrit,
          recebimentosPendentes: totalRecebimentosPendentes,
        });
      } catch (e: any) {
        setError(e?.message || "Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    }

    compute();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financeiro, produtos, recebimentos, finErr, prodErr, recErr, tick]);

  const alertas = useMemo(() => {
    const alerts: Array<{ tipo: "warn" | "danger"; texto: string }> = [];

    if (kpis.itensCriticos > 0) {
      alerts.push({
        tipo: "warn",
        texto: `Você tem ${kpis.itensCriticos} itens em estoque crítico.`,
      });
    }

    if (kpis.lucro < 0) {
      alerts.push({
        tipo: "danger",
        texto: `Seu caixa está negativo (lucro: ${moneyPreview(kpis.lucro)}).`,
      });
    }

    if (kpis.recebimentosPendentes > 0) {
      alerts.push({
        tipo: "warn",
        texto: `Existem ${kpis.recebimentosPendentes} recebimentos aguardando conferência.`,
      });
    }

    return alerts;
  }, [kpis]);

  // Retorno mantém os nomes que seu componente espera
  return {
    loading,
    error,
    refresh, // <-- agora disponível
    serieMensal: seriesMensal,
    estoquePizza,
    itensCriticos,
    kpis,
    alertas,
  };
}

function moneyPreview(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
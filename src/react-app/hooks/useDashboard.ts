"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type FinanceiroRow = {
  id?: string;
  empresa_id?: string | null;
  tipo?: "receita" | "despesa" | string;
  valor?: number | string | null;
  created_at?: string | null;
  data?: string | null;
};

type ProdutoRow = {
  id?: string;
  empresa_id?: string | null;
  nome?: string | null;
  estoque_atual?: number | null;
  estoque_minimo?: number | null;
  custo_unitario?: number | null;
};

type RecebimentoRow = {
  id?: string;
  empresa_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  data_recebimento?: string | null;
  conferido?: boolean | null;
};

type MesSerie = {
  name: string;
  receitas: number;
  despesas: number;
};

type EstoquePizza = {
  name: string;
  value: number;
};

type ItemCritico = {
  id?: string;
  nome: string;
  atual: number;
  minimo: number;
};

type DashboardKpis = {
  receitaTotal: number;
  despesaTotal: number;
  lucro: number;
  margem: number;
  itensCriticos: number;
  recebimentosPendentes: number;
};

type DashboardAlerta = {
  tipo: "warn" | "danger";
  texto: string;
};

function toNumber(v: unknown) {
  if (v === null || v === undefined) return 0;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : 0;
  }

  if (typeof v === "string") {
    const s = v.trim().replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  return d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
}

function lastMonths(count: number) {
  const out: Date[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(dt);
  }

  return out;
}

function safeDate(raw: unknown): Date | null {
  if (!raw) return null;
  const dt = new Date(String(raw));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isRecebimentoPendente(row: RecebimentoRow) {
  const status = String(row.status ?? "").toLowerCase().trim();

  if (status === "pendente") return true;
  if (status === "aguardando") return true;
  if (status === "em_aberto") return true;
  if (status === "aberto") return true;

  if (row.conferido === false) return true;
  if (!row.data_recebimento) return true;

  return false;
}

function moneyPreview(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seriesMensal, setSeriesMensal] = useState<MesSerie[]>([]);
  const [estoquePizza, setEstoquePizza] = useState<EstoquePizza[]>([]);
  const [itensCriticos, setItensCriticos] = useState<ItemCritico[]>([]);

  const [kpis, setKpis] = useState<DashboardKpis>({
    receitaTotal: 0,
    despesaTotal: 0,
    lucro: 0,
    margem: 0,
    itensCriticos: 0,
    recebimentosPendentes: 0,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();

    if (!supabase) {
      const fake = lastMonths(6).map((d) => ({
        name: monthLabel(d),
        receitas: 8000,
        despesas: 5200,
      }));

      setSeriesMensal(fake);
      setEstoquePizza([
        { name: "Ok", value: 18 },
        { name: "Crítico", value: 4 },
      ]);
      setItensCriticos([
        { id: "1", nome: "Mussarela", atual: 2, minimo: 6 },
        { id: "2", nome: "Calabresa", atual: 1, minimo: 4 },
        { id: "3", nome: "Catupiry", atual: 1, minimo: 3 },
      ]);
      setKpis({
        receitaTotal: 48000,
        despesaTotal: 31200,
        lucro: 16800,
        margem: 35,
        itensCriticos: 4,
        recebimentosPendentes: 1,
      });
      setLoading(false);
      return;
    }

    const empresaId =
      typeof window !== "undefined" ? localStorage.getItem("empresa_id") || "" : "";

    try {
      let finQuery = supabase.from("financeiro").select("*");
      if (empresaId) finQuery = finQuery.eq("empresa_id", empresaId);

      let prodQuery = supabase.from("produtos").select("*");
      if (empresaId) prodQuery = prodQuery.eq("empresa_id", empresaId);

      let recebimentosRows: RecebimentoRow[] = [];

      try {
        let recebQuery = supabase.from("recebimentos").select("*");
        if (empresaId) recebQuery = recebQuery.eq("empresa_id", empresaId);

        const { data: recebData, error: recebErr } = await recebQuery;

        if (!recebErr) {
          recebimentosRows = (recebData ?? []) as RecebimentoRow[];
        }
      } catch {
        recebimentosRows = [];
      }

      const [
        { data: fin, error: finErr },
        { data: prods, error: prodErr },
      ] = await Promise.all([finQuery, prodQuery]);

      if (finErr) throw finErr;
      if (prodErr) throw prodErr;

      const finRows = (fin ?? []) as FinanceiroRow[];
      const prodRows = (prods ?? []) as ProdutoRow[];

      const months = lastMonths(6);
      const buckets = new Map<
        string,
        { receitas: number; despesas: number; label: string }
      >();

      months.forEach((d) => {
        buckets.set(monthKey(d), {
          receitas: 0,
          despesas: 0,
          label: monthLabel(d),
        });
      });

      for (const row of finRows) {
        const dt = safeDate(row.created_at || row.data);
        if (!dt) continue;

        const key = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1));
        const bucket = buckets.get(key);
        if (!bucket) continue;

        const valor = toNumber(row.valor);
        const tipo = String(row.tipo ?? "").toLowerCase();

        if (tipo === "receita") bucket.receitas += valor;
        if (tipo === "despesa") bucket.despesas += valor;
      }

      const serie: MesSerie[] = months.map((d) => {
        const bucket = buckets.get(monthKey(d));

        return {
          name: monthLabel(d),
          receitas: Math.round(bucket?.receitas ?? 0),
          despesas: Math.round(bucket?.despesas ?? 0),
        };
      });

      const receitaTotal = finRows
        .filter((t) => String(t.tipo ?? "").toLowerCase() === "receita")
        .reduce((acc, t) => acc + toNumber(t.valor), 0);

      const despesaTotal = finRows
        .filter((t) => String(t.tipo ?? "").toLowerCase() === "despesa")
        .reduce((acc, t) => acc + toNumber(t.valor), 0);

      const lucro = receitaTotal - despesaTotal;
      const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0;

      const criticos = prodRows
        .map((p) => ({
          id: p.id,
          nome: String(p.nome ?? "Item"),
          atual: toNumber(p.estoque_atual),
          minimo: toNumber(p.estoque_minimo),
        }))
        .filter((p) => p.minimo > 0 && p.atual <= p.minimo)
        .sort((a, b) => a.atual / a.minimo - b.atual / b.minimo)
        .slice(0, 8);

      const totalOk = prodRows.filter((p) => {
        const atual = toNumber(p.estoque_atual);
        const minimo = toNumber(p.estoque_minimo);

        if (minimo <= 0) return true;
        return atual > minimo;
      }).length;

      const totalCrit = Math.max(0, prodRows.length - totalOk);
      const totalRecebimentosPendentes = recebimentosRows.filter(isRecebimentoPendente).length;

      setSeriesMensal(serie);
      setItensCriticos(criticos);
      setEstoquePizza([
        { name: "Ok", value: totalOk },
        { name: "Crítico", value: totalCrit },
      ]);
      setKpis({
        receitaTotal: Math.round(receitaTotal),
        despesaTotal: Math.round(despesaTotal),
        lucro: Math.round(lucro),
        margem: Number.isFinite(margem) ? Math.round(margem * 10) / 10 : 0,
        itensCriticos: totalCrit,
        recebimentosPendentes: totalRecebimentosPendentes,
      });
    } catch (err: unknown) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erro ao carregar dashboard";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const alertas = useMemo<DashboardAlerta[]>(() => {
    const alerts: DashboardAlerta[] = [];

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
  }, [kpis.itensCriticos, kpis.lucro, kpis.recebimentosPendentes]);

  return {
    loading,
    error,
    refresh,
    serieMensal: seriesMensal,
    estoquePizza,
    itensCriticos,
    kpis,
    alertas,
  };
}
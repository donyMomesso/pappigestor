"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Badge } from "@/react-app/components/ui/badge";
import { Button } from "@/react-app/components/ui/button";
import { LineChart, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface FluxoBucket {
  data: string;
  entradas: number;
  saidas_previstas: number;
  saidas_pagas: number;
  saldo_dia: number;
  saldo_acumulado: number;
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export default function Page() {
  const { localUser } = useAppAuth();
  const [fluxo, setFluxo] = useState<FluxoBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const empresaId =
    localUser?.empresa_id ||
    (typeof window !== "undefined" ? localStorage.getItem("empresa_id") : "") ||
    (typeof window !== "undefined" ? localStorage.getItem("pId") : "") ||
    "";

  async function load() {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/financeiro/fluxo-caixa?days=30", {
        headers: { "x-empresa-id": empresaId },
        cache: "no-store",
      });
      const json = res.ok ? await res.json() : [];
      setFluxo(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Erro ao carregar fluxo de caixa:", error);
      setFluxo([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [empresaId]);

  const resumo = useMemo(() => {
    return fluxo.reduce(
      (acc, item) => {
        acc.entradas += item.entradas;
        acc.saidasPrevistas += item.saidas_previstas;
        acc.saidasPagas += item.saidas_pagas;
        acc.piorSaldo = Math.min(acc.piorSaldo, item.saldo_acumulado);
        acc.melhorSaldo = Math.max(acc.melhorSaldo, item.saldo_acumulado);
        return acc;
      },
      {
        entradas: 0,
        saidasPrevistas: 0,
        saidasPagas: 0,
        piorSaldo: fluxo[0]?.saldo_acumulado || 0,
        melhorSaldo: fluxo[0]?.saldo_acumulado || 0,
      }
    );
  }, [fluxo]);

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Fluxo de caixa projetado</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Visão de 30 dias com base nos lançamentos previstos e pagos.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <TrendingUp className="h-4 w-4" /> Entradas
            </div>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(resumo.entradas)}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <Wallet className="h-4 w-4" /> Saídas previstas
            </div>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(resumo.saidasPrevistas)}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <TrendingDown className="h-4 w-4" /> Pior saldo
            </div>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(resumo.piorSaldo)}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <LineChart className="h-4 w-4" /> Melhor saldo
            </div>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(resumo.melhorSaldo)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Linha do tempo financeira</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          ) : fluxo.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500">
              Ainda não há dados suficientes para montar a projeção do fluxo de caixa.
            </div>
          ) : (
            <div className="space-y-3">
              {fluxo.map((item) => (
                <div key={item.data} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900">{item.data}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          Entradas {formatCurrency(item.entradas)}
                        </Badge>
                        <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50">
                          Saídas {formatCurrency(item.saidas_previstas)}
                        </Badge>
                        <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">
                          Pagas {formatCurrency(item.saidas_pagas)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm text-zinc-600 lg:text-right">
                      <div>Saldo do dia: <span className="font-semibold text-zinc-900">{formatCurrency(item.saldo_dia)}</span></div>
                      <div>Saldo acumulado: <span className="font-semibold text-zinc-900">{formatCurrency(item.saldo_acumulado)}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

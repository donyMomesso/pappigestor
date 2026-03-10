"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  Check,
  LayoutDashboard,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LOGO_URL =
  "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

interface DashboardData {
  totais: {
    total_lancamentos: number;
    total_pagos: number;
    total_a_pagar: number;
    total_aguardando: number;
    valor_previsto_total: number;
    valor_pago_total: number;
  };
  porCategoria: Array<{
    categoria: string;
    quantidade: number;
    valor_previsto: number;
    valor_pago: number;
  }>;
}

const COLORS = ["#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar dashboard");
      }

      const dashboardData = (await res.json()) as DashboardData;
      setData(dashboardData);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return "R$ 0,00";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  const pieData = useMemo(() => {
    return (
      data?.porCategoria.map((cat) => ({
        name: cat.categoria,
        value: cat.valor_previsto || 0,
      })) || []
    );
  }, [data]);

  const barData = useMemo(() => {
    return (
      data?.porCategoria.map((cat) => ({
        categoria: cat.categoria.substring(0, 8),
        previsto: cat.valor_previsto || 0,
        pago: cat.valor_pago || 0,
      })) || []
    );
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-10 h-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <Link
            href="/app"
            className="rounded-lg p-2 transition-colors hover:bg-amber-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>

          <div className="flex items-center gap-2">
            <img
              src={LOGO_URL}
              alt="Pappi Gestor"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="font-bold text-gray-800 dark:text-white">
                Pappi Gestor
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Dashboard Financeiro
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              <LayoutDashboard className="w-4 h-4" />
              Painel Operacional
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              Visão geral do financeiro
            </h2>
            <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
              Pappi Gestor — Inteligência em tempo real.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {data?.totais.total_aguardando || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aguardando
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-800">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-200" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">
                    {data?.totais.total_a_pagar || 0}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    A Pagar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-200 dark:bg-green-800">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-200" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                    {data?.totais.total_pagos || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    Pagos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200 dark:bg-amber-800">
                  <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-200" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-800 dark:text-amber-100">
                    {data?.totais.total_lancamentos || 0}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Valor Previsto Total
                  </p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(data?.totais.valor_previsto_total || 0)}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/50">
                  <TrendingUp className="w-7 h-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Valor Pago Total
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(data?.totais.valor_pago_total || 0)}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/50">
                  <TrendingDown className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-white">
                Gastos por Categoria
              </CardTitle>
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
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-white">
                Previsto vs Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <XAxis
                        type="number"
                        tickFormatter={(v: number) =>
                          `R$${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        width={70}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                      <Bar
                        dataKey="previsto"
                        fill="#f97316"
                        name="Previsto"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="pago"
                        fill="#22c55e"
                        name="Pago"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-400">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-white">
              Resumo por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">
                      Qtd
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                      Previsto
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                      Pago
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                      Diferença
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.porCategoria?.map((cat, i) => (
                    <tr
                      key={cat.categoria}
                      className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                          {cat.categoria}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
                        {cat.quantidade}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                        {formatCurrency(cat.valor_previsto)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                        {formatCurrency(cat.valor_pago)}
                      </td>
                      <td className="px-4 py-3 text-right">
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

                  {!data?.porCategoria?.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        Nenhum dado por categoria encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
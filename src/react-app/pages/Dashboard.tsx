import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, FileText, Clock, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const LOGO_URL = 'https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png';

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

const COLORS = ['#f97316', '#ef4444', '#eab308', '#22c55e', '#3b82f6'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const pieData = data?.porCategoria.map(cat => ({
    name: cat.categoria,
    value: cat.valor_previsto || 0
  })) || [];

  const barData = data?.porCategoria.map(cat => ({
    categoria: cat.categoria.substring(0, 8),
    previsto: cat.valor_previsto || 0,
    pago: cat.valor_pago || 0
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-amber-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Pappi Gestor" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800 dark:text-white">Pappi Gestor</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Cards de Totais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{data?.totais.total_aguardando || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Aguardando</p>
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
                  <p className="text-2xl font-bold text-blue-800">{data?.totais.total_a_pagar || 0}</p>
                  <p className="text-xs text-blue-600">A Pagar</p>
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
                  <p className="text-2xl font-bold text-green-800">{data?.totais.total_pagos || 0}</p>
                  <p className="text-xs text-green-600">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-800">{data?.totais.total_lancamentos || 0}</p>
                  <p className="text-xs text-amber-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Valores */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valor Previsto Total</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(data?.totais.valor_previsto_total || 0)}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valor Pago Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(data?.totais.valor_pago_total || 0)}
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
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
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
                      <XAxis type="number" tickFormatter={(v: number) => `R$${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="categoria" width={70} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
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

        {/* Tabela de Categorias */}
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
                  {data?.porCategoria.map((cat, i) => (
                    <tr key={cat.categoria} className="border-b last:border-0 hover:bg-gray-50">
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
                        <span className={cat.valor_previsto - cat.valor_pago >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(cat.valor_previsto - cat.valor_pago)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

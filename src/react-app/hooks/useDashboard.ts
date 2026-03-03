"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useDashboard() {
  const [data, setData] = useState<any>({
    faturamento: [],
    estoqueStatus: [],
    metricas: { totalVendas: 0, totalPagar: 0, itensCriticos: 0 }
  });
  const [loading, setLoading] = useState(true);

  async function fetchDashboardData() {
    setLoading(true);
    
    // 1. Buscar Dados Financeiros para o Gráfico de Barras
    const { data: fin } = await supabase.from("financeiro").select("*");
    
    // 2. Buscar Dados de Estoque para o Gráfico de Pizza
    const { data: est } = await supabase.from("produtos").select("*");

    // Processamento Simples para os Gráficos
    const faturamentoMensal = [
      { name: 'Jan', valor: 4000 }, { name: 'Fev', valor: 3000 },
      { name: 'Mar', valor: 5000 }, { name: 'Abr', valor: 4500 }
    ];

    const statusEstoque = [
      { name: 'Ok', value: est?.filter(p => p.estoque_atual > p.estoque_minimo).length || 0 },
      { name: 'Crítico', value: est?.filter(p => p.estoque_atual <= p.estoque_minimo).length || 0 }
    ];

    setData({
      faturamento: faturamentoMensal,
      estoqueStatus: statusEstoque,
      metricas: {
        totalVendas: fin?.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0) || 0,
        totalPagar: fin?.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0) || 0,
        itensCriticos: statusEstoque[1].value
      }
    });
    setLoading(false);
  }

  useEffect(() => { fetchDashboardData(); }, []);

  return { ...data, loading, refresh: fetchDashboardData };
}
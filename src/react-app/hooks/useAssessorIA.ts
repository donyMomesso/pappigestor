"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAssessorIA() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function analisarNegocio() {
    setLoading(true);
    
    // Busca dados de estoque e financeiro para análise
    const { data: produtos } = await supabase.from("produtos").select("*");
    const { data: fin } = await supabase.from("financeiro").select("*");

    const novosInsights = [];

    // Lógica de análise automática
    const criticos = produtos?.filter(p => p.estoque_atual <= p.estoque_minimo) || [];
    if (criticos.length > 0) {
      novosInsights.push({
        tipo: "alerta",
        titulo: "Risco de Rutura",
        mensagem: `Tens ${criticos.length} itens abaixo do stock mínimo. Sugiro gerar lista de compras.`,
        prioridade: "alta"
      });
    }

    const pendentes = fin?.filter(t => t.status !== "pago" && t.tipo === "despesa").length || 0;
    if (pendentes > 0) {
      novosInsights.push({
        tipo: "financeiro",
        titulo: "Fluxo de Caixa",
        mensagem: `Existem ${pendentes} boletos pendentes. Verifica o DDA para evitar multas.`,
        prioridade: "media"
      });
    }

    setInsights(novosInsights);
    setLoading(false);
  }

  useEffect(() => { analisarNegocio(); }, []);

  return { insights, loading, refresh: analisarNegocio };
}
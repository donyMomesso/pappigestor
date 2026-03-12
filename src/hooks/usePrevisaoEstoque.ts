"use client";

import { useMemo } from "react";
import { useEstoque, type ProdutoEstoque } from "@/react-app/hooks/useEstoque";

export type CriticidadeEstoque = "alta" | "media" | "baixa";

export type PrevisaoRupturaItem = {
  id: string;
  nome: string;
  unidade: string;
  categoria: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  sugestaoCompra: number;
  diasRestantes: number;
  consumoMedio: number;
  criticidade: CriticidadeEstoque;
};

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function arredondarSugestao(valor: number): number {
  if (valor <= 0) return 0;
  if (valor <= 10) return Math.ceil(valor);
  return Math.ceil(valor / 5) * 5;
}

export function usePrevisaoEstoque() {
  const { produtos, loading, refresh } = useEstoque();

  const previsoes = useMemo<PrevisaoRupturaItem[]>(() => {
    const pesoCriticidade: Record<CriticidadeEstoque, number> = {
      alta: 0,
      media: 1,
      baixa: 2,
    };

    return (produtos ?? [])
      .map((p: ProdutoEstoque): PrevisaoRupturaItem => {
        const estoqueAtual =
          toNumber(p.quantidade_atual) ||
          toNumber(p.estoque_atual) ||
          0;

        const estoqueMinimo = toNumber(p.estoque_minimo) || 0;

        const nome = String(p.produto_nome ?? p.nome ?? "Item sem nome");

        const unidade = String(p.unidade_medida ?? p.unidade ?? "un");

        const categoria = String(p.categoria_produto ?? p.categoria ?? "geral");

        const consumoMedio =
          estoqueMinimo > 0
            ? Math.max(estoqueMinimo / 7, 0.1)
            : Math.max(estoqueAtual / 15, 0.1);

        const diasRestantes =
          estoqueAtual > 0 ? Math.floor(estoqueAtual / consumoMedio) : 0;

        const sugestaoBase =
          estoqueMinimo > 0 ? estoqueMinimo * 2 : consumoMedio * 15;

        const sugestaoCompra = arredondarSugestao(
          Math.max(sugestaoBase - estoqueAtual, 0)
        );

        let criticidade: CriticidadeEstoque = "baixa";

        if (estoqueAtual <= estoqueMinimo || diasRestantes <= 3) {
          criticidade = "alta";
        } else if (diasRestantes <= 7) {
          criticidade = "media";
        }

        return {
          id: String(p.id),
          nome,
          unidade,
          categoria,
          estoqueAtual,
          estoqueMinimo,
          sugestaoCompra,
          diasRestantes,
          consumoMedio: Number(consumoMedio.toFixed(2)),
          criticidade,
        };
      })
      .filter((item: PrevisaoRupturaItem) => item.estoqueAtual > 0 || item.estoqueMinimo > 0)
      .sort((a: PrevisaoRupturaItem, b: PrevisaoRupturaItem) => {
        return (
          pesoCriticidade[a.criticidade] - pesoCriticidade[b.criticidade] ||
          a.diasRestantes - b.diasRestantes
        );
      });
  }, [produtos]);

  const alertas = useMemo<PrevisaoRupturaItem[]>(() => {
    return previsoes.filter(
      (item: PrevisaoRupturaItem) => item.criticidade !== "baixa"
    );
  }, [previsoes]);

  return {
    loading,
    refresh,
    previsoes,
    alertas,
  };
}
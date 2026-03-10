// src/hooks/useABC.ts
"use client";

import { useApi } from "@/hooks/useApi";

export type ABCCategoria = {
  categoria: string;
  valor: number;
};

export function useABC() {
  // Busca os produtos e calcula a curva ABC
  const { data: produtos, error, loading } = useApi<any[]>("/api/produtos");

  let resultado: ABCCategoria[] = [];

  if (produtos) {
    const mapa: Record<string, number> = {};

    for (const item of produtos) {
      const categoria = String(item.categoria ?? "outros");
      const custo = Number(item.custo_unitario ?? 0);
      const estoque = Number(item.estoque_atual ?? 0);
      const valor = custo * estoque;

      if (!mapa[categoria]) mapa[categoria] = 0;
      mapa[categoria] += valor;
    }

    resultado = Object.entries(mapa)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
  }

  return {
    data: resultado,
    error,
    loading,
  };
}
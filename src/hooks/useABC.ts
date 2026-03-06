"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type ABCCategoria = {
  categoria: string;
  valor: number;
};

export function useABC() {
  const [data, setData] = useState<ABCCategoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setData([]);
        setLoading(false);
        return;
      }

      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("categoria, custo_unitario, estoque_atual");

      if (error) {
        console.error("Erro ao carregar Curva ABC:", error);
        setData([]);
        setLoading(false);
        return;
      }

      const mapa: Record<string, number> = {};

      for (const item of produtos ?? []) {
        const categoria = String(item.categoria ?? "outros");
        const custo = Number(item.custo_unitario ?? 0);
        const estoque = Number(item.estoque_atual ?? 0);
        const valor = custo * estoque;

        if (!mapa[categoria]) mapa[categoria] = 0;
        mapa[categoria] += valor;
      }

      const resultado: ABCCategoria[] = Object.entries(mapa)
        .map(([categoria, valor]) => ({
          categoria,
          valor,
        }))
        .sort((a, b) => b.valor - a.valor);

      setData(resultado);
      setLoading(false);
    }

    load();
  }, []);

  return {
    data,
    loading,
  };
}
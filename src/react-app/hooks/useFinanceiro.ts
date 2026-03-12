"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type TransacaoFinanceiro = {
  id: string;
  created_at?: string | null;
  vencimento?: string | null;
  valor?: number | null;
  descricao?: string | null;
  status?: string | null;
  [key: string]: any;
};

export function useFinanceiro() {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinanceiro = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setTransacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("financeiro")
      .select("*")
      .order("vencimento", { ascending: true });

    if (!error) setTransacoes((data ?? []) as TransacaoFinanceiro[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFinanceiro();
  }, [fetchFinanceiro]);

  return { transacoes, loading, refresh: fetchFinanceiro };
}
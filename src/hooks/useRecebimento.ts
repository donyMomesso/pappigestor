"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type RecebimentoEntrega = {
  id: string;
  created_at?: string | null;
  fornecedor_nome?: string | null;
  nota_numero?: string | null;
  total?: number | null;
  status?: string | null;
  [key: string]: any;
};

export function useRecebimento() {
  const [entregas, setEntregas] = useState<RecebimentoEntrega[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecebimentos = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEntregas([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setEntregas((data ?? []) as RecebimentoEntrega[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  return { entregas, loading, refresh: fetchRecebimentos };
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useFinanceiro() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFinanceiro() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro") 
      .select("*")
      .order("vencimento", { ascending: true });

    if (!error) setTransacoes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  return { transacoes, loading, refresh: fetchFinanceiro };
}

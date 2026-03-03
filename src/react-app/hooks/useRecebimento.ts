"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useRecebimento() {
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRecebimentos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setEntregas(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRecebimentos();
  }, []);

  return { entregas, loading, refresh: fetchRecebimentos };
}
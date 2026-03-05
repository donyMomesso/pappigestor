"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";

export type ProdutoEstoque = {
  id: string;
  nome?: string | null;
  unidade?: string | null;
  empresa_id?: string | null;
  [key: string]: any;
};

export function useEstoque() {
  const { localUser } = useAppAuth();

  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstoque = useCallback(async () => {
    const empresaId = localUser?.empresa_id;
    if (!empresaId) {
      setProdutos([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setProdutos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (!error) setProdutos((data ?? []) as ProdutoEstoque[]);
    setLoading(false);
  }, [localUser?.empresa_id]);

  const adicionarProduto = useCallback(
    async (novoProduto: Partial<ProdutoEstoque>) => {
      const empresaId = localUser?.empresa_id;
      if (!empresaId) {
        console.error("Erro: Utilizador sem empresa vinculada.");
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error("Supabase não configurado.");
        return;
      }

      const { error } = await supabase.from("produtos").insert([
        {
          ...novoProduto,
          empresa_id: empresaId,
        },
      ]);

      if (!error) {
        await fetchEstoque();
      } else {
        console.error("Erro ao inserir:", error.message);
      }
    },
    [localUser?.empresa_id, fetchEstoque]
  );

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);

  return { produtos, loading, refresh: fetchEstoque, adicionarProduto };
}
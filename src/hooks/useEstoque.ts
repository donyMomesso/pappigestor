// src/hooks/useEstoque.ts
"use client";

import { useApi } from "@/hooks/useApi";

export type ProdutoEstoque = {
  id: string;
  nome?: string | null;
  produto_nome?: string | null;
  unidade?: string | null;
  unidade_medida?: string | null;
  categoria?: string | null;
  categoria_produto?: string | null;
  empresa_id?: string | null;
  quantidade_atual?: number | null;
  estoque_atual?: number | null;
  estoque_minimo?: number | null;
};

export function useEstoque() {
  const { data, error, loading } = useApi<ProdutoEstoque[]>("/api/estoque");

  return {
    produtos: data ?? [],
    error,
    loading,
  };
}
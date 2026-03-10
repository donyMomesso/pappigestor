// src/hooks/useEstoque.ts
"use client";

import { useApi } from "@/hooks/useApi";

export type ProdutoEstoque = {
  id: string;
  nome?: string | null;
  unidade?: string | null;
  empresa_id?: string | null;
  [key: string]: any;
};

export function useEstoque() {
  // Hook genérico que chama a API de estoque
  const { data, error, loading } = useApi<ProdutoEstoque[]>("/api/estoque");

  return {
    produtos: data || [],
    error,
    loading,
  };
}
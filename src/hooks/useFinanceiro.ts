// src/hooks/useFinanceiro.ts
"use client";

import { useApi } from "@/hooks/useApi";

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
  // Hook genérico que chama a API de financeiro
  const { data, error, loading } = useApi<TransacaoFinanceiro[]>("/api/financeiro");

  return {
    transacoes: data || [],
    error,
    loading,
  };
}
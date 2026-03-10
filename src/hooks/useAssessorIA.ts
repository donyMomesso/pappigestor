"use client";

import { useCallback, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AssessorArquivo = {
  id: string;
  created_at: string;
  nome: string | null;
  tipo: string | null;
  url: string | null;
  status: string | null;
  resultado?: any;
};

type AssessorTemplate = {
  id: string;
  nome: string;
  prompt: string;
};

export function useAssessorIA() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const listarArquivos = useCallback(async (): Promise<AssessorArquivo[]> => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    setLoading(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from("assessor_ia_arquivos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AssessorArquivo[];
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao listar arquivos");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const listarTemplates = useCallback(async (): Promise<AssessorTemplate[]> => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from("assessor_ia_templates")
        .select("id,nome,prompt")
        .order("nome", { ascending: true });

      if (error) throw error;
      return (data ?? []) as AssessorTemplate[];
    } catch {
      return [];
    }
  }, []);

  const processarArquivo = useCallback(async (arquivoId: string, templateId?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setErro("Supabase não configurado");
      return null;
    }

    setLoading(true);
    setErro(null);

    try {
      const res = await fetch("/api/assessor-ia/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arquivoId, templateId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Falha ao processar");
      }

      return await res.json();
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao processar");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    erro,
    listarArquivos,
    listarTemplates,
    processarArquivo,
  };
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";

export function useEstoque() {
  const { localUser } = useAppAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEstoque() {
    if (!localUser?.empresa_id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("empresa_id", localUser.empresa_id) // Filtra apenas dados da empresa logada
      .order("nome", { ascending: true });

    if (!error) setProdutos(data || []);
    setLoading(false);
  }

  async function adicionarProduto(novoProduto: any) {
    if (!localUser?.empresa_id) {
      console.error("Erro: Utilizador sem empresa vinculada.");
      return;
    }

    // Injeta automaticamente o ID da empresa no novo registo
    const { error } = await supabase.from("produtos").insert([
      { 
        ...novoProduto, 
        empresa_id: localUser.empresa_id 
      }
    ]);

    if (!error) {
      fetchEstoque();
    } else {
      console.error("Erro ao inserir:", error.message);
    }
  }

  useEffect(() => {
    // Só tenta procurar dados se o utilizador e a empresa já estiverem carregados
    if (localUser?.empresa_id) {
      fetchEstoque();
    }
  }, [localUser?.empresa_id]);

  return { produtos, loading, refresh: fetchEstoque, adicionarProduto };
}

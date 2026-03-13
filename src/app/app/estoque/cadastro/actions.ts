'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// @ts-ignore
import { createClient } from "@/utils/supabase/server";

export async function cadastrarItemEstoque(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { error: "Usuário não autenticado." };
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("perfis_usuarios")
    .select("empresa_id, pizzaria_id")
    .eq("email", user.email)
    .single();

  if (perfilError || !perfil) {
    return { error: "Perfil do usuário não encontrado." };
  }

  const produtoId = Number(formData.get("produto_id"));
  const quantidadeAtual = Number(formData.get("quantidade"));
  const estoqueMinimo = Number(formData.get("minimo"));

  if (!produtoId || Number.isNaN(produtoId)) {
    return { error: "Produto inválido." };
  }

  if (Number.isNaN(quantidadeAtual)) {
    return { error: "Quantidade inválida." };
  }

  if (Number.isNaN(estoqueMinimo)) {
    return { error: "Estoque mínimo inválido." };
  }

  const empresaId = perfil.empresa_id ?? perfil.pizzaria_id;

  if (!empresaId) {
    return { error: "Empresa do usuário não identificada." };
  }

  const novoItem = {
    produto_id: produtoId,
    quantidade_atual: quantidadeAtual,
    estoque_minimo: estoqueMinimo,
    empresa_id: empresaId,
    pizzaria_id: empresaId,
    ultima_atualizacao: new Date().toISOString(),
  };

  const { error } = await supabase.from("estoque").insert(novoItem);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/estoque");
  redirect("/app/estoque");
}
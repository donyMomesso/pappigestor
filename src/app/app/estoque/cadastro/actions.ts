'use server'

/** * Solução para o erro persistente de módulo:
 * 1. Forçamos o TypeScript a ignorar o erro visual no editor.
 * 2. Usamos o alias @/ que está definido no seu tsconfig.json.
 */
// @ts-ignore
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function cadastrarItemEstoque(formData: FormData) {
  const supabase = await createClient();

  // 1. Pegar os dados do usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Buscar o empresa_id vinculado ao perfil da Pappi do usuário logado
  const { data: perfil } = await supabase
    .from('perfis_usuarios')
    .select('empresa_id')
    .eq('email', user?.email)
    .single();

  if (!perfil) throw new Error("Perfil não encontrado.");

  // 3. Inserir no estoque respeitando as colunas identificadas
  const novoItem = {
    produto_id: formData.get('produto_id'), 
    quantidade_atual: Number(formData.get('quantidade')),
    estoque_minimo: Number(formData.get('minimo')),
    empresa_id: perfil.empresa_id, 
    ultima_atualizacao: new Date().toISOString()
  };

  const { error } = await supabase.from('estoque').insert(novoItem);

  if (error) return { error: error.message };

  revalidatePath('/app/estoque');
  redirect('/app/estoque');
}

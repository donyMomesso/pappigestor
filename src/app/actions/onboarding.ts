"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function registrarEmpresa(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );

  const nomeEmpresa = formData.get('nome_empresa') as string;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Usuário não autenticado." };

  try {
    // 1. Criar a empresa na tabela 'empresas'
    const { data: empresa, error: errorEmpresa } = await supabase
      .from('empresas')
      .insert([{ 
        nome: nomeEmpresa, 
        dono_id: user.id,
        status: 'ativo'
      }])
      .select()
      .single();

    if (errorEmpresa) throw errorEmpresa;

    // 2. Atualizar o METADATA do usuário com o novo empresa_id
    // Isso é vital para o RLS (segurança) que configuramos antes
    const { error: errorUser } = await supabase.auth.updateUser({
      data: { empresa_id: empresa.id }
    });

    if (errorUser) throw errorUser;

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
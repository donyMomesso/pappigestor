"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function processarNotaXML(formData: FormData) {
  // No Next.js 15+, cookies() é uma Promise e deve ser aguardada
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const arquivo = formData.get('file') as File;
  const empresa_id = formData.get('empresa_id') as string;

  if (!arquivo || !empresa_id) {
    return { success: false, error: "Dados incompletos (ficheiro ou ID da empresa ausente)." };
  }

  try {
    // Lógica de processamento simulada
    const dadosExtraidos = {
      fornecedor: "FORNECEDOR IDENTIFICADO IA",
      valorTotal: 1250.50,
      vencimento: new Date().toISOString().split('T')[0],
    };

    // Lançamento no Financeiro
    const { error } = await supabase.from('financeiro').insert({
      descricao: `IMPORTAÇÃO: ${arquivo.name}`,
      valor: dadosExtraidos.valorTotal,
      vencimento: dadosExtraidos.vencimento,
      tipo: 'despesa',
      status: 'pendente',
      empresa_id: empresa_id
    });

    if (error) throw error;

    return { success: true, message: "Documento processado com sucesso!" };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro na integração com o banco." };
  }
}
"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function processarAnexoGmail(messageId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );

  try {
    // Simulação de leitura profunda via Vision API
    // Em produção, aqui você buscaria o blob do anexo no Gmail
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      dados: {
        fornecedor: "Pappi Alimentos Distribuidora",
        valor_total: 450.90,
        vencimento: "20/03/2026",
        itens: ["Farinha 00 25kg", "Tomate Pelati 10kg"]
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function escanearNotasNoGmail() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;

  if (!token) {
    return { success: false, error: "Acesso ao Gmail expirado. Por favor, saia e entre novamente com o Google." };
  }

  try {
    const query = encodeURIComponent('subject:("Nota Fiscal" OR "Fatura" OR "NF-e") has:attachment');
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    const messages = data.messages || [];

    if (messages.length === 0) {
      return { success: true, notas: [] };
    }

    const detalhes = await Promise.all(
      messages.map(async (msg: any) => {
        const dRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return await dRes.json();
      })
    );

    const notas = detalhes.map((d: any) => ({
      id: d.id,
      fornecedor: d.payload.headers.find((h: any) => h.name === "From")?.value || "Desconhecido",
      assunto: d.payload.headers.find((h: any) => h.name === "Subject")?.value || "Sem Assunto",
      data: new Date(parseInt(d.internalDate)).toLocaleDateString('pt-BR'),
      snippet: d.snippet,
    }));

    return { success: true, notas };
  } catch (err: any) {
    return { success: false, error: "Falha na API do Gmail: " + err.message };
  }
}
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Teste() {
  const [status, setStatus] = useState("testando...");

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setStatus("Supabase não configurado (ENV ausente) ❌");
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) setStatus("Erro: " + error.message);
      else if (data.session) setStatus("Conectado ao Supabase ✅");
      else setStatus("Sem sessão (faça login) ⚠️");
    })();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Teste Supabase</h1>
      <p>{status}</p>
    </div>
  );
}

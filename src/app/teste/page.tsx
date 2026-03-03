"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Teste() {
  const [status, setStatus] = useState("testando...");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) setStatus("Erro: " + error.message);
      else setStatus("Conectado ao Supabase ✅");
    })();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Teste Supabase</h1>
      <p>{status}</p>
    </div>
  );
}
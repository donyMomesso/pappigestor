"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AppHome() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/auth";
        return;
      }
      setEmail(data.user.email ?? "");
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard (SaaS)</h1>
      <p className="mt-2 text-gray-700">Logado como: {email}</p>

      <button onClick={logout} className="mt-6 rounded-xl border px-4 py-2">
        Sair
      </button>
    </div>
  );
}
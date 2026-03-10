// src/hooks/useSessionSync.ts
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { LocalUser } from "@/hooks/useAppAuth";

export function useSessionSync() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sync = async () => {
      setLoading(true);
      setErro(null);

      try {
        // Consulta o endpoint /api/me
        const localUser = await api<LocalUser>("/api/me");

        if (localUser) {
          // Salva no localStorage para persistência
          localStorage.setItem("empresa_id", localUser.empresa_id);
          localStorage.setItem("user_role", localUser.nivel_acesso);

          setUser(localUser);
        } else {
          setUser(null);
        }
      } catch (err: any) {
        setErro(err?.message ?? "Erro ao sincronizar sessão");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, []);

  const clearSession = () => {
    localStorage.removeItem("empresa_id");
    localStorage.removeItem("user_role");
    setUser(null);
  };

  return {
    user,
    loading,
    erro,
    clearSession,
  };
}
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SyncSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return; // ✅ evita erro de null

    const empresaId = searchParams.get("pId");
    const role = searchParams.get("role");
    const next = searchParams.get("next") ?? "/app/dashboard";

    if (empresaId) {
      localStorage.setItem("empresa_id", empresaId);
    }
    if (role) {
      localStorage.setItem("user_role", role);
    }

    router.replace(next);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-600 font-bold italic uppercase tracking-widest">
        Sincronizando sessão...
      </p>
    </div>
  );
}
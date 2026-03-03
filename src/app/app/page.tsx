"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";

export default function AppHome() {
  const [pId, setPId] = useState("");

  useEffect(() => {
    setPId(localStorage.getItem("pId") || "");
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
          Pappi <span className="text-orange-500">Gestor</span>
        </h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic mt-1">
          Base local (mock) para você plugar suas APIs depois
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder='ID da pizzaria (ex: "pappi")'
            value={pId}
            onChange={(e) => setPId(e.target.value)}
            className="h-12 rounded-2xl"
          />
          <Button
            onClick={() => {
              localStorage.setItem("pId", pId || "pappi");
              window.location.reload();
            }}
            className="h-12 rounded-2xl"
          >
            Salvar Pizzaria
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Link href="/app/lista-compras" className="block">
          <div className="bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-3xl p-6 shadow-lg shadow-orange-200">
            <div className="text-xs font-black uppercase tracking-widest opacity-90">Compras</div>
            <div className="text-2xl font-black italic uppercase tracking-tight mt-1">Lista de Compras</div>
            <div className="text-sm font-semibold opacity-90 mt-2">Reposição • Alertas • Cotação por WhatsApp</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

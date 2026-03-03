"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Building2, Plus, ShieldCheck, MapPin, ArrowLeft, Hash } from "lucide-react";
import Link from "next/link";

type Empresa = {
  id: string;
  nome: string;
  segmento?: string;
  status?: string;
  cnpj?: string;
  plano?: string;
};

export default function EmpresasPage() {
  const { localUser } = useAppAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

       const email = localUser?.email || "";
        if (!email) {
          setEmpresas([]);
          return;
        }

        const res = await fetch("http://localhost:8787/api/empresas/minhas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const err = await res.text().catch(() => "");
          console.error("Erro API empresas:", res.status, err);
          setEmpresas([]);
          return;
        }

        const data = (await res.json().catch(() => ({ empresas: [] }))) as {
          empresas?: Empresa[];
        };

        setEmpresas(Array.isArray(data.empresas) ? data.empresas : []);
      } catch (e) {
        console.error("Erro ao carregar empresas:", e);
        setEmpresas([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [localUser?.email]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Empresas</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
              Gestão de unidades de negócio
            </p>
          </div>
        </div>

        <Button className="bg-rose-600 rounded-2xl h-12 px-6 font-black italic uppercase text-xs tracking-widest hover:bg-rose-700 transition-all text-white">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Unidade
        </Button>
      </div>

      {loading && (
        <Card className="border-gray-100 rounded-[30px] shadow-sm bg-white">
          <CardContent className="p-8 text-sm text-gray-500 font-bold">
            Carregando empresas...
          </CardContent>
        </Card>
      )}

      {!loading && empresas.length === 0 && (
        <Card className="border-gray-100 rounded-[30px] shadow-sm bg-white">
          <CardContent className="p-8">
            <p className="text-sm text-gray-500 font-bold">Nenhuma empresa encontrada para este usuário.</p>
            <p className="text-xs text-gray-400 mt-1">
              Faça login com um email que exista em <span className="font-mono">perfis_usuarios</span>.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {empresas.map((emp) => (
          <Card
            key={emp.id}
            className="border-gray-100 rounded-[40px] shadow-sm hover:shadow-2xl transition-all group overflow-hidden bg-white"
          >
            <CardContent className="p-10 flex flex-col md:flex-row md:items-center gap-10">
              <div className="w-24 h-24 bg-gray-50 rounded-[30px] flex items-center justify-center text-gray-300 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all shadow-inner">
                <Building2 size={40} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                    {emp.nome}
                  </h2>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-black uppercase italic border border-green-100">
                    {emp.status ?? "ativo"}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Hash size={10} /> ID
                    </p>
                    <p className="text-sm font-bold text-gray-600 break-all">{emp.id}</p>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <ShieldCheck size={10} /> Segmento
                    </p>
                    <p className="text-sm font-black italic text-rose-600 uppercase tracking-tighter">
                      {emp.segmento ?? "food"}
                    </p>
                  </div>

                  <div className="hidden md:block">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin size={10} /> Localização
                    </p>
                    <p className="text-sm font-bold text-gray-600">Campinas - SP</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2">
                <Button
                  className="rounded-2xl bg-gray-900 text-white font-black italic uppercase text-[10px] tracking-widest h-12 px-6"
                  onClick={() => {
                    localStorage.setItem("empresa_id", emp.id);
                    window.location.href = "/app";
                  }}
                >
                  Entrar
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-2xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 font-black italic uppercase text-[10px] tracking-widest h-12"
                >
                  Editar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
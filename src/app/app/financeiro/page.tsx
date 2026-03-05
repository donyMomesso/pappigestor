"use client";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import {
  Building2,
  RefreshCw,
  Plus,
  ArrowLeft,
  TrendingUp,
  Wallet,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function FinanceiroPage() {
  const { localUser } = useAppAuth();
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!localUser?.empresa_id) return;

    const fetchConexoes = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setConexoes([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("conexoes_bancarias")
          .select("*")
          .eq("empresa_id", localUser.empresa_id);

        if (error) throw error;

        if (!data || data.length === 0) {
          setConexoes([
            { id: "1", banco_nome: "Itaú Empresas", last_sync: "há 2h", status: "ok" },
            { id: "2", banco_nome: "Cora Bank", last_sync: "há 5m", status: "ok" },
          ]);
        } else {
          setConexoes(data);
        }
      } catch (err) {
        console.error("Erro ao buscar conexões:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConexoes();
  }, [localUser?.empresa_id]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
              Financeiro
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-2">
              Controle de Fluxo e Open Finance
            </p>
          </div>
        </div>

        <Button className="bg-gray-900 rounded-[20px] h-14 px-8 font-black italic uppercase text-xs tracking-widest hover:bg-orange-600 transition-all gap-3 text-white shadow-xl">
          <RefreshCw className="w-4 h-4" /> Sincronizar Tudo
        </Button>
      </div>

      {/* Cards de Saldo e Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[35px] p-8 text-white shadow-xl relative overflow-hidden group">
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic mb-2">
              Saldo Consolidado
            </p>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">R$ 42.500,00</h2>
            <div className="mt-6 flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest italic">
              <TrendingUp size={16} /> +R$ 2.400,00 hoje
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[35px] p-8 shadow-sm hover:shadow-lg transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic mb-2">
            Previsão Saídas
          </p>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-red-500">R$ 12.800,00</h2>
          <p className="mt-6 text-gray-400 font-bold text-xs uppercase italic tracking-widest">
            Próximos 7 dias
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[35px] p-8 shadow-sm border-l-4 border-l-orange-500 hover:shadow-lg transition-all flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic mb-2">
              DDA Pendente
            </p>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">08 Boletos</h2>
          </div>
          <Link
            href="/app/financeiro/dda"
            className="mt-6 inline-flex items-center gap-2 text-orange-600 font-black uppercase italic text-[10px] hover:text-orange-700 tracking-widest"
          >
            Verificar DDA <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Conexões Bancárias */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">
            Cofres Conectados
          </h2>
          <Button
            variant="outline"
            className="rounded-[15px] border-orange-200 text-orange-600 font-black italic uppercase text-[10px] tracking-widest px-6 h-12 hover:bg-orange-50"
          >
            <Plus size={16} className="mr-2" /> Conectar Banco
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
            </div>
          ) : (
            conexoes.map((c, idx) => (
              <Card
                key={c.id || idx}
                className="border-gray-100 rounded-[30px] hover:border-orange-500 hover:shadow-xl transition-all bg-white group cursor-pointer"
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                      <Building2 size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase text-gray-800 tracking-tighter">
                        {c.banco_nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                          Sincronizado {c.last_sync || "recentemente"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-gray-400 group-hover:text-orange-600 font-black italic uppercase text-[10px] tracking-widest"
                  >
                    Ver Transações
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  ArrowLeft,
  Search,
  Loader2,
  History,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function ProdutosMasterPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const res = await fetch("/api/produtos-master");
        if (res.ok) setProdutos(await res.json());
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaster();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
              Mestre de Produtos
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
              Inteligência de SKUs e Curva ABC
            </p>
          </div>
        </div>

        <Button className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl h-12 px-6 font-black italic uppercase text-xs tracking-widest hover:scale-105 transition-all">
          <Plus size={16} className="mr-2" /> Novo Cadastro Mestre
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        <Input
          className="pl-16 h-16 rounded-[28px] border-gray-100 bg-white shadow-sm font-bold text-lg text-gray-700"
          placeholder="Filtrar por nome ou SKU..."
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-20">
            <Loader2 className="animate-spin mx-auto text-orange-500" />
          </div>
        ) : (
          produtos.map((p) => (
            <Card
              key={p.id}
              className="border-gray-100 rounded-[40px] shadow-sm hover:shadow-2xl transition-all group bg-white overflow-hidden"
            >
              <CardContent className="p-10 flex items-start gap-8">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                  <Package size={40} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black italic uppercase text-gray-800 tracking-tighter leading-none">
                      {p.nome_padrao}
                    </h3>
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-black uppercase italic border ${
                        p.curva_abc === "A"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-gray-50 text-gray-400 border-gray-100"
                      }`}
                    >
                      CURVA {p.curva_abc}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                    {p.categoria} • SKU: {p.codigo_sku || "N/A"}
                  </p>

                  <div className="flex items-center gap-10">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Preço Médio
                      </p>
                      <p className="text-xl font-black italic text-gray-900">
                        R$ {p.preco_medio?.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Variação (Mês)
                      </p>
                      <div
                        className={`flex items-center gap-1 font-black italic ${
                          p.variacao > 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {p.variacao > 0 ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        {Math.abs(p.variacao)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl hover:bg-orange-50 text-gray-300 hover:text-orange-500"
                  >
                    <History size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl hover:bg-orange-50 text-gray-300 hover:text-orange-500"
                  >
                    <BarChart3 size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calculator, Search, ArrowLeft, TrendingDown, 
  Check, Filter, Loader2, DollarSign, History, Zap 
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function CotacaoPage() {
  const { localUser } = useAppAuth();
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCotacoes = async () => {
      try {
        const res = await fetch("/api/cotacoes");
        if (res.ok) setCotacoes(await res.json());
      } finally { setIsLoading(false); }
    };
    fetchCotacoes();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Cotação</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Inteligência de compra e economia</p>
          </div>
        </div>

        <Button className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl h-12 px-6 font-black italic uppercase text-xs tracking-widest hover:scale-105 transition-all gap-2 text-white">
          <Zap size={16} fill="white" /> Iniciar Cotação IA
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
        <Input 
          className="pl-14 h-16 rounded-[28px] border-gray-100 bg-white shadow-sm font-bold text-gray-600" 
          placeholder="Pesquisar cotações ativas ou históricas..."
        />
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></div>
        ) : cotacoes.map((c) => (
          <Card key={c.id} className="border-gray-100 rounded-[35px] shadow-sm hover:shadow-xl transition-all group bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center p-8 gap-8">
                <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 shadow-inner">
                  <Calculator size={32} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black italic uppercase text-gray-800 tracking-tight">{c.produto_nome}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-black uppercase italic border border-orange-100">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                    {c.fornecedores_count} fornecedores consultados • Aberta em {c.data_abertura}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 text-right pr-4 border-r border-gray-50">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Melhor Preço</p>
                    <p className="text-lg font-black italic text-green-600">R$ {c.melhor_preco?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Diferença</p>
                    <p className="text-lg font-black italic text-red-500">-{c.economia_percentual}%</p>
                  </div>
                </div>

                <Button className="rounded-2xl bg-gray-900 text-white font-black italic uppercase text-[10px] tracking-widest h-12 px-8">
                  Ver Mapa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

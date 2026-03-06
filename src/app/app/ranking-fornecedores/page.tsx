"use client";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { 
  Trophy, Star, TrendingDown, TrendingUp, Search, 
  Loader2, ArrowLeft, Filter, Calendar, Award
} from "lucide-react";
import Link from "next/link";

export default function RankingFornecedoresPage() {
  const { localUser } = useAppAuth();
  const [ranking, setRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch("/api/ranking-fornecedores");
        if (res.ok) setRanking(await res.json());
      } finally { setIsLoading(false); }
    };
    fetchRanking();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Ranking</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Melhores parceiros por preço</p>
          </div>
        </div>

        <Button className="bg-gray-900 rounded-2xl h-12 px-6 font-black italic uppercase text-xs tracking-widest text-white hover:bg-black transition-all gap-2">
          <Filter size={16} /> Filtrar Período
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></div>
        ) : ranking.map((f, idx) => (
          <Card key={f.id} className="border-gray-100 rounded-[35px] shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="flex items-center p-8 gap-8">
                {/* Posição no Ranking */}
                <div className="relative">
                   <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-2xl font-black italic ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-400'}`}>
                      {idx + 1}º
                   </div>
                   {idx === 0 && <Trophy className="absolute -top-2 -right-2 text-yellow-600 fill-yellow-400" size={24} />}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-black italic uppercase text-gray-800 tracking-tight">{f.fornecedor_nome}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {f.total_cotacoes} cotações ganhas • {f.categoria}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 text-right">
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Economia Gerada</p>
                      <p className="text-lg font-black italic text-green-600">R$ {f.economia_total?.toLocaleString('pt-BR')}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Score Preço</p>
                      <div className="flex items-center justify-end gap-1 text-orange-500 font-black italic">
                         <Star size={14} className="fill-orange-500" /> {f.score?.toFixed(1)}
                      </div>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Package, Plus, Edit2, Trash2, Search, Loader2, ArrowLeft, Barcode, TrendingUp, Tag } from "lucide-react";
import Link from "next/link";

export default function ProdutosPage() {
  const { localUser } = useAppAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/produtos");
        if (res.ok) setProdutos(await res.json());
      } finally { setIsLoading(false); }
    };
    fetchProducts();
  }, []);

  const filtered = produtos.filter(p => p.nome_produto.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Produtos</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Gestão de insumos e mercadorias</p>
          </div>
        </div>

        <Button className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl h-12 px-6 font-black italic uppercase text-xs tracking-widest hover:scale-105 transition-all">
          <Plus className="w-4 h-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
        <Input 
          className="pl-14 h-16 rounded-[25px] border-gray-100 bg-white shadow-sm font-bold text-gray-600" 
          placeholder="Pesquisar produto ou código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></div>
        ) : filtered.map((p) => (
          <Card key={p.id} className="border-gray-100 rounded-[35px] shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-pink-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-7 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                  <Package size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Último Preço</p>
                  <p className="text-lg font-black italic text-orange-600">R$ {p.ultimo_preco_pago?.toFixed(2) || '0,00'}</p>
                </div>
              </div>

              <h3 className="font-black italic uppercase tracking-tighter text-gray-800 text-lg leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                {p.nome_produto}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-[9px] px-2 py-1 rounded-lg bg-gray-50 text-gray-500 font-black uppercase italic border border-gray-100">
                  <Tag size={10} className="inline mr-1" /> {p.categoria_produto}
                </span>
                <span className="text-[9px] px-2 py-1 rounded-lg bg-pink-50 text-pink-600 font-black uppercase italic border border-pink-100">
                  {p.unidade_medida}
                </span>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-400">
                   <Barcode size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">{p.codigo_barras || 'S/ SKU'}</span>
                </div>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="rounded-xl hover:bg-orange-50 text-gray-300 hover:text-orange-500"><Edit2 size={16}/></Button>
                   <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 size={16}/></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

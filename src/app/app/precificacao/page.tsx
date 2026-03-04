"use client";

import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Label } from "@/react-app/components/ui/label";
import {
  Plus,
  ArrowLeft,
  Calculator,
  TrendingUp,
  Percent,
  DollarSign,
  Save,
  Trash2,
  BrainCircuit,
  Info
} from "lucide-react";
import Link from "next/link";

interface InsumoFicha {
  produto_id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custo_unitario: number;
}

export default function PrecificacaoPage() {
  // Estados para Precificação
  const [nomePrato, setNomePrato] = useState("");
  const [insumos, setInsumos] = useState<InsumoFicha[]>([]);
  const [markup, setMarkup] = useState(3); // Padrão 3x o custo
  const [impostos, setImpostos] = useState(4); // Simples Nacional médio
  const [comissao, setComissao] = useState(12); // Apps de entrega
  
  // Estados de cálculo
  const [custoTotalInsumos, setCustoTotalInsumos] = useState(0);
  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [margemReal, setMargemReal] = useState(0);

  // Cálculo automático toda vez que algo muda
  useEffect(() => {
    const total = insumos.reduce((acc, item) => acc + (item.quantidade * item.custo_unitario), 0);
    setCustoTotalInsumos(total);

    const sugerido = total * markup;
    setPrecoSugerido(sugerido);

    // Margem de Contribuição: Preço - (Custo + Impostos% + Comissão%)
    const descontos = sugerido * ((impostos + comissao) / 100);
    const lucroLiquido = sugerido - total - descontos;
    setMargemReal(sugerido > 0 ? (lucroLiquido / sugerido) * 100 : 0);
  }, [insumos, markup, impostos, comissao]);

  const adicionarInsumoTeste = () => {
    const novo: InsumoFicha = {
      produto_id: Math.random().toString(),
      nome: "Insumo Exemplo",
      quantidade: 0.200,
      unidade: "kg",
      custo_unitario: 45.00
    };
    setInsumos([...insumos, novo]);
  };

  return (
    <div className="relative min-h-[80vh] pb-12">
      {/* BRANDING IA */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03]">
        <BrainCircuit className="w-64 h-64 text-blue-900" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">
                Engenharia de <span className="text-blue-600">Preços</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-1">Cálculo de CMV e Margem Real</p>
            </div>
          </div>
          <Button className="h-12 px-6 rounded-2xl bg-gray-900 text-white font-black uppercase text-xs shadow-xl">
            <Save size={18} className="mr-2" /> Salvar Ficha Técnica
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: MONTAGEM DO PRATO */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-[35px] border-none shadow-xl bg-white overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nome do Produto/Pizza</Label>
                  <Input 
                    value={nomePrato} 
                    onChange={(e) => setNomePrato(e.target.value)}
                    placeholder="Ex: Pizza Calabresa Especial" 
                    className="h-14 rounded-2xl font-bold text-lg bg-gray-50 border-0"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black italic uppercase text-gray-900 flex items-center gap-2">
                      <Calculator size={18} className="text-blue-600" /> Composição de Custos
                    </h3>
                    <Button onClick={adicionarInsumoTeste} variant="outline" size="sm" className="rounded-xl border-blue-100 text-blue-600 font-bold uppercase text-[10px]">
                      <Plus size={14} className="mr-1" /> Adicionar Insumo
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {insumos.length === 0 ? (
                      <div className="p-10 border-2 border-dashed border-gray-100 rounded-[30px] text-center">
                        <p className="text-gray-400 text-sm font-bold italic uppercase">Nenhum insumo adicionado.</p>
                      </div>
                    ) : (
                      insumos.map((item, idx) => (
                        <div key={item.produto_id} className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex-1 min-w-[150px]">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Insumo</p>
                            <p className="font-bold text-gray-800">{item.nome}</p>
                          </div>
                          <div className="w-24">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Qtd</p>
                            <Input type="number" className="h-10 font-bold" defaultValue={item.quantidade} />
                          </div>
                          <div className="w-32 text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Subtotal</p>
                            <p className="font-black text-blue-600">R$ {(item.quantidade * item.custo_unitario).toFixed(2)}</p>
                          </div>
                          <button className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* COLUNA DIREITA: RESULTADOS E IA */}
          <div className="space-y-6">
            <Card className="rounded-[35px] border-none bg-gray-900 text-white shadow-2xl p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl"></div>
              <div className="relative z-10 space-y-6">
                <div className="text-center pb-6 border-b border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Preço Sugerido (Venda)</p>
                  <h2 className="text-5xl font-black italic">R$ {precoSugerido.toFixed(2)}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><TrendingUp size={10}/> CMV Real</p>
                    <p className="text-xl font-black italic text-orange-400">{(custoTotalInsumos > 0 ? (custoTotalInsumos / precoSugerido) * 100 : 0).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><Percent size={10}/> Margem L.</p>
                    <p className="text-xl font-black italic text-green-400">{margemReal.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Markup Desejado</Label>
                    <Input 
                      type="number" 
                      value={markup} 
                      onChange={(e) => setMarkup(parseFloat(e.target.value))}
                      className="bg-white/10 border-0 h-12 text-white font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Taxas de App / Cartão (%)</Label>
                    <Input 
                      type="number" 
                      value={comissao} 
                      onChange={(e) => setComissao(parseFloat(e.target.value))}
                      className="bg-white/10 border-0 h-12 text-white font-black"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <p className="text-[9px] font-black uppercase text-blue-400 flex items-center gap-1 mb-2">
                    <Info size={12}/> Sugestão da IA
                  </p>
                  <p className="text-xs text-blue-100 italic leading-relaxed">
                    {margemReal < 20 
                      ? "Atenção! Sua margem está abaixo do ideal para o setor. Recomendo aumentar o markup para pelo menos 3.5 ou reduzir o peso da proteína."
                      : "Excelente! Esta precificação garante um CMV saudável e cobre bem as taxas de entrega."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}   
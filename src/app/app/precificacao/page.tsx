"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Label } from "@/react-app/components/ui/label";
import {
  ArrowLeft,
  Calculator,
  TrendingUp,
  Percent,
  Save,
  Trash2,
  BrainCircuit,
  Info,
  Search,
  Loader2,
  Package,
  Sparkles,
  Lock
} from "lucide-react";
import Link from "next/link";

interface InsumoFicha {
  produto_id: number;
  nome: string;
  quantidade: number;
  unidade: string;
  custo_unitario: number;
}

interface ProdutoCatalogo {
  id: number;
  nome_produto: string;
  unidade_medida: string;
  ultimo_preco_pago: number | null;
}

export default function PrecificacaoPage() {
  const [nomePrato, setNomePrato] = useState("");
  const [insumos, setInsumos] = useState<InsumoFicha[]>([]);
  const [markup, setMarkup] = useState(3);
  const [impostos, setImpostos] = useState(4);
  const [comissao, setComissao] = useState(12);
  
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [custoTotalInsumos, setCustoTotalInsumos] = useState(0);
  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [margemReal, setMargemReal] = useState(0);
  
  const [isSaving, setIsSaving] = useState(false);

  const getHeaders = useCallback(() => {
    const pId = localStorage.getItem("pId") || localStorage.getItem("empresaId") || "";
    return { "Content-Type": "application/json", "x-empresa-id": pId };
  }, []);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const res = await fetch("/api/produtos", { headers: getHeaders() });
        if (res.ok) setProdutos(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchProdutos();
  }, [getHeaders]);

  useEffect(() => {
    const total = insumos.reduce((acc, item) => acc + (item.quantidade * item.custo_unitario), 0);
    setCustoTotalInsumos(total);
    const sugerido = total * markup;
    setPrecoSugerido(sugerido);
    const descontos = sugerido * ((impostos + comissao) / 100);
    const lucroLiquido = sugerido - total - descontos;
    setMargemReal(sugerido > 0 ? (lucroLiquido / sugerido) * 100 : 0);
  }, [insumos, markup, impostos, comissao]);

  const adicionarInsumo = (p: ProdutoCatalogo) => {
    if (insumos.some(i => i.produto_id === p.id)) {
      alert("Este insumo já está na ficha técnica!");
      return;
    }

    let un = p.unidade_medida.toLowerCase();
    let custo = p.ultimo_preco_pago || 0;
    let qtdInicial = 1;

    // ✅ MÁGICA DE CONVERSÃO: KG para GRAMAS / Litro para ML
    if (un === "kg") {
      un = "g";
      custo = custo / 1000; // Custo por grama
      qtdInicial = 100; // Sugere 100g de início
    } else if (un === "l" || un === "litro") {
      un = "ml";
      custo = custo / 1000; // Custo por ML
      qtdInicial = 100;
    }

    const novo: InsumoFicha = {
      produto_id: p.id,
      nome: p.nome_produto,
      quantidade: qtdInicial,
      unidade: un,
      custo_unitario: custo
    };
    
    setInsumos([...insumos, novo]);
    setShowResults(false);
    setSearchTerm("");
  };

  const removerInsumo = (id: number) => setInsumos(insumos.filter(i => i.produto_id !== id));

  const atualizarQtd = (id: number, qtd: string) => {
    setInsumos(insumos.map(i => i.produto_id === id ? { ...i, quantidade: parseFloat(qtd) || 0 } : i));
  };

  const handleSalvarFicha = async () => {
    if (!nomePrato.trim()) return alert("Dê um nome para este produto (Ex: Pizza Calabresa)!");
    if (insumos.length === 0) return alert("Adicione pelo menos um insumo para compor o custo.");

    setIsSaving(true);
    try {
      const response = await fetch("/api/fichas-tecnicas", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          nome_produto: nomePrato,
          markup: markup,
          impostos: impostos,
          comissao: comissao,
          preco_sugerido: precoSugerido,
          margem_liquida: margemReal,
          custo_total: custoTotalInsumos,
          insumos: insumos
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "LIMIT_REACHED") {
          alert(`🔒 ${data.message}\n\nLiberte todo o poder do Pappi Gestor mudando para o Plano Pro!`);
        } else {
          throw new Error(data.error);
        }
        return;
      }
      
      alert(`✅ Ficha Técnica salva com sucesso!\n\nPreço Sugerido: R$ ${precoSugerido.toFixed(2)}\nMargem Líquida: ${margemReal.toFixed(1)}%`);
      setNomePrato("");
      setInsumos([]);
      setSearchTerm("");
    } catch (error) {
      alert("Erro ao salvar a ficha técnica.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSearch = produtos.filter(p => 
    p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-[80vh] pb-12">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03]">
        <BrainCircuit className="w-64 h-64 text-blue-900" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 shadow-sm transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Engenharia de <span className="text-blue-600">Preços</span></h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-1 flex items-center gap-1">
                 Cálculo de CMV e Margem Real
              </p>
            </div>
          </div>
          <Button onClick={handleSalvarFicha} disabled={isSaving} className="h-12 px-6 rounded-2xl bg-gray-900 text-white font-black uppercase text-xs shadow-xl hover:scale-105 transition-transform">
            {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Salvar Ficha Técnica</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUNA ESQUERDA: Ficha */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-[35px] border-none shadow-xl bg-white overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nome do Produto</Label>
                  <Input value={nomePrato} onChange={(e) => setNomePrato(e.target.value)} placeholder="Ex: Pizza Calabresa Especial" className="h-14 rounded-2xl font-bold text-lg bg-gray-50 border-0 focus-visible:ring-0" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black italic uppercase text-gray-900 flex items-center gap-2"><Calculator size={18} className="text-blue-600" /> Composição de Custos</h3>
                    <div className="relative">
                      <Input 
                        placeholder="Buscar insumo do estoque..." 
                        value={searchTerm}
                        onChange={(e) => {setSearchTerm(e.target.value); setShowResults(true);}}
                        className="h-10 rounded-xl text-xs w-64 focus-visible:ring-0 bg-gray-50 border-0 font-bold"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      
                      {showResults && searchTerm.length > 0 && (
                        <div className="absolute right-0 mt-2 w-full md:w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1">
                          {filteredSearch.length === 0 ? (
                            <div className="p-4 text-center text-xs font-bold text-gray-400">Nenhum produto encontrado no estoque.</div>
                          ) : (
                            filteredSearch.map(p => (
                              <div key={p.id} onClick={() => adicionarInsumo(p)} className="p-3 hover:bg-blue-50 cursor-pointer rounded-xl transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center">
                                <div>
                                  <p className="font-black text-sm text-gray-800">{p.nome_produto}</p>
                                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">{p.unidade_medida}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-blue-600">R$ {p.ultimo_preco_pago || '0.00'}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {insumos.length === 0 ? (
                      <div className="p-10 border-2 border-dashed border-gray-200 rounded-[30px] text-center bg-gray-50/50 flex flex-col items-center justify-center">
                         <Package size={32} className="text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm font-black italic uppercase">Nenhum insumo na ficha.</p>
                        <p className="text-gray-400 text-xs font-bold mt-1">Busque acima para compor os custos.</p>
                      </div>
                    ) : (
                      insumos.map((item) => (
                        <div key={item.produto_id} className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-blue-200">
                          <div className="flex-1 min-w-[150px]">
                            <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">Insumo</p>
                            <p className="font-black text-gray-800 uppercase tracking-tight">{item.nome}</p>
                          </div>
                          <div className="w-28">
                            <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">Qtd ({item.unidade})</p>
                            <Input type="number" step="0.001" value={item.quantidade} onChange={(e) => atualizarQtd(item.produto_id, e.target.value)} className="h-10 font-black text-center border-0 bg-white shadow-sm focus-visible:ring-0" />
                          </div>
                          <div className="w-28">
                            <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">Custo Un.</p>
                            <Input type="number" step="0.0001" value={item.custo_unitario} onChange={(e) => setInsumos(insumos.map(i => i.produto_id === item.produto_id ? { ...i, custo_unitario: parseFloat(e.target.value) || 0 } : i))} className="h-10 font-bold text-center border-0 bg-white shadow-sm text-xs focus-visible:ring-0" />
                          </div>
                          <div className="w-32 text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">Subtotal</p>
                            <p className="font-black text-blue-600 text-lg italic">R$ {(item.quantidade * item.custo_unitario).toFixed(2)}</p>
                          </div>
                          <button onClick={() => removerInsumo(item.produto_id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {insumos.length > 0 && (
                    <div className="flex justify-between items-center p-5 bg-gray-900 rounded-2xl text-white shadow-lg mt-6">
                      <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Custo Total dos Insumos</p>
                      <p className="text-2xl font-black italic text-green-400">R$ {custoTotalInsumos.toFixed(2)}</p>
                    </div>
                  )}

                </div>
              </div>
            </Card>
          </div>

          {/* COLUNA DIREITA: Resultados */}
          <div className="space-y-6">
            <Card className="rounded-[35px] border-none bg-gray-900 text-white shadow-2xl p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="text-center pb-6 border-b border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2 flex items-center justify-center gap-1">
                    <Lock size={10}/> Preço Sugerido (Pro)
                  </p>
                  <h2 className="text-5xl font-black italic tracking-tighter">R$ {precoSugerido.toFixed(2)}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><TrendingUp size={12} className="text-orange-400"/> CMV Real</p>
                    <p className="text-2xl font-black italic text-white mt-1">{(custoTotalInsumos > 0 && precoSugerido > 0 ? (custoTotalInsumos / precoSugerido) * 100 : 0).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><Percent size={12} className="text-green-400"/> Margem Líq.</p>
                    <p className={`text-2xl font-black italic mt-1 ${margemReal < 20 ? 'text-red-400' : 'text-white'}`}>{margemReal.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Markup (x)</Label>
                      <Input type="number" step="0.1" value={markup} onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)} className="bg-white/10 border-0 h-12 text-white font-black text-center text-lg focus-visible:ring-1 focus-visible:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Impostos (%)</Label>
                      <Input type="number" step="0.1" value={impostos} onChange={(e) => setImpostos(parseFloat(e.target.value) || 0)} className="bg-white/10 border-0 h-12 text-white font-black text-center text-lg focus-visible:ring-1 focus-visible:ring-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Taxas App / Cartão (%)</Label>
                    <Input type="number" step="0.1" value={comissao} onChange={(e) => setComissao(parseFloat(e.target.value) || 0)} className="bg-white/10 border-0 h-12 text-white font-black text-center text-lg focus-visible:ring-1 focus-visible:ring-blue-500" />
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 mb-2">
                    <Sparkles size={14}/> Pappi.IA Analisa
                  </p>
                  <p className="text-xs text-blue-50 font-bold leading-relaxed">
                    {margemReal <= 0 ? "Adicione insumos para ver a análise." : 
                     margemReal < 20 
                      ? "⚠️ Alerta vermelho! Sua margem líquida está sufocada. Considere aumentar o Markup para no mínimo 3.5 ou renegociar as taxas de entrega." 
                      : margemReal < 35
                      ? "A sua margem está saudável e dentro do padrão de mercado para Food Service. Se quiser lucrar mais, tente focar em vendas diretas."
                      : "🔥 Excelente precificação! Você tem uma margem de lucro fortíssima. Este produto tem potencial para ser o carro-chefe da casa."}
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
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  AlertTriangle,
  Package,
  Loader2,
  Search,
  ClipboardCheck,
  Plus,
  Minus,
  Save,
  ShoppingCart,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  BrainCircuit,
  Sparkles,
  PackagePlus,
} from "lucide-react";
import Link from "next/link";

// ==========================================
// BANCO DE DADOS LOCAL DA IA - FOOD SERVICE
// ==========================================
interface ProdutoFoodService {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
}

const PRODUTOS_FOOD_SERVICE: ProdutoFoodService[] = [
  { id: "prot-001", nome: "Peito de Frango sem Osso", categoria: "Proteínas (Aves e Carnes)", unidadeMedida: "kg" },
  { id: "prot-002", nome: "Filé de Frango (Sassami)", categoria: "Proteínas (Aves e Carnes)", unidadeMedida: "kg" },
  { id: "emb-001", nome: "Linguiça Calabresa Reta", categoria: "Embutidos e Suínos", unidadeMedida: "kg" },
  { id: "lat-001", nome: "Queijo Mussarela", categoria: "Laticínios e Frios", unidadeMedida: "kg" },
  { id: "lat-002", nome: "Queijo Mussarela Fatiada", categoria: "Laticínios e Frios", unidadeMedida: "kg" },
  { id: "merc-001", nome: "Farinha de Trigo Especial", categoria: "Mercearia e Condimentos", unidadeMedida: "sc" },
  { id: "merc-002", nome: "Óleo de Soja", categoria: "Mercearia e Condimentos", unidadeMedida: "cx" },
  { id: "merc-007", nome: "Extrato de Tomate", categoria: "Mercearia e Condimentos", unidadeMedida: "un" },
  { id: "merc-012", nome: "Orégano em Folhas", categoria: "Mercearia e Condimentos", unidadeMedida: "pct" },
];

function buscarProdutosFoodService(termo: string): ProdutoFoodService[] {
  if (!termo || termo.length < 2) return [];
  const termoLower = termo.toLowerCase();
  return PRODUTOS_FOOD_SERVICE.filter(
    (p) =>
      p.nome.toLowerCase().includes(termoLower) ||
      p.categoria.toLowerCase().includes(termoLower)
  );
}

const CATEGORIAS = [
  "Insumos", "Embalagens", "Bebidas", "Mercado", "Limpeza", "Outros", 
  "Proteínas (Aves e Carnes)", "Embutidos e Suínos", "Laticínios e Frios", 
  "Congelados e Vegetais", "Mercearia e Condimentos"
];
const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd", "pc", "sc"];

interface Produto {
  id: number;
  nome_produto: string;
  categoria_produto: string;
  unidade_medida: string;
}

interface Estoque {
  id: number;
  produto_id: number;
  quantidade_atual: number;
  estoque_minimo: number;
  produto_nome?: string;
  categoria_produto?: string;
  unidade_medida?: string;
  data_validade?: string;
  lote?: string;
}

interface EstoqueComProduto extends Estoque {
  produto?: Produto;
}

export default function EstoquePage() {
  const [mounted, setMounted] = useState(false);
  const [estoques, setEstoques] = useState<EstoqueComProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEstoque, setSelectedEstoque] = useState<EstoqueComProduto | null>(null);
  
  const [auditValue, setAuditValue] = useState("");
  const [auditMinimoValue, setAuditMinimoValue] = useState("");
  const [auditValidadeValue, setAuditValidadeValue] = useState("");
  const [auditLoteValue, setAuditLoteValue] = useState("");
  
  const [sendingToLista, setSendingToLista] = useState(false);
  const [savingAudit, setSavingAudit] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  const [addForm, setAddForm] = useState({
    nome_produto: "",
    categoria_produto: "Insumos",
    unidade_medida: "un",
    quantidade_atual: "",
    estoque_minimo: "",
  });
  
  const [sugestoes, setSugestoes] = useState<ProdutoFoodService[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchEstoques();
    fetchProdutos();
  }, []);

  const getPId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    }
    return "";
  };

  const fetchEstoques = async () => {
    const pId = getPId();
    try {
      const res = await fetch("/api/estoque", { 
        headers: { "x-pizzaria-id": pId } 
      });
      if (res.ok) {
        const data = (await res.json()) as EstoqueComProduto[];
        setEstoques(data);
      }
    } catch (err) {
      console.error("Erro fetchEstoques:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProdutos = async () => {
    const pId = getPId();
    try {
      const res = await fetch("/api/produtos", { 
        headers: { "x-pizzaria-id": pId } 
      });
      if (res.ok) {
        const data = (await res.json()) as Produto[];
        setProdutos(data);
      }
    } catch (err) {
      console.error("Erro fetchProdutos:", err);
    }
  };

  const handleOpenAudit = (estoque: EstoqueComProduto) => {
    setSelectedEstoque(estoque);
    setAuditValue(String(estoque.quantidade_atual || 0));
    setAuditMinimoValue(String(estoque.estoque_minimo || 0));
    setAuditValidadeValue(estoque.data_validade || "");
    setAuditLoteValue(estoque.lote || "");
    setIsAuditDialogOpen(true);
  };

  const handleSaveAudit = async () => {
    if (!selectedEstoque) return;
    setSavingAudit(true);
    const pId = getPId();

    try {
      const res = await fetch(`/api/estoque/${selectedEstoque.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          "x-pizzaria-id": pId 
        },
        body: JSON.stringify({
          quantidade_atual: parseFloat(auditValue) || 0,
          estoque_minimo: parseFloat(auditMinimoValue) || 0,
          data_validade: auditValidadeValue || null,
          lote: auditLoteValue || null,
        }),
      });

      if (res.ok) {
        setIsAuditDialogOpen(false);
        fetchEstoques();
      } else {
        alert("Erro ao salvar auditoria");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setSavingAudit(false);
    }
  };

  const handleEnviarParaLista = async () => {
    if (!selectedEstoque) return;
    setSendingToLista(true);
    const pId = getPId();

    try {
      const quantidadeSolicitar = Math.max(parseFloat(auditMinimoValue) - parseFloat(auditValue), 1);
      const res = await fetch("/api/lista-compras", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-pizzaria-id": pId 
        },
        body: JSON.stringify({
          produto_id: selectedEstoque.produto_id,
          quantidade_solicitada: quantidadeSolicitar,
          observacao: `Solicitado via auditoria. Atual: ${auditValue}`,
        }),
      });

      if (res.ok) {
        alert("Item enviado para a lista de compras!");
        setIsAuditDialogOpen(false);
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setSendingToLista(false);
    }
  };

  const handleNomeChange = (value: string) => {
    setAddForm(prev => ({ ...prev, nome_produto: value }));
    if (value.length >= 2) {
      setSugestoes(buscarProdutosFoodService(value));
      setMostrarSugestoes(true);
    } else {
      setSugestoes([]);
      setMostrarSugestoes(false);
    }
  };

  const selecionarSugestao = (prod: ProdutoFoodService) => {
    setAddForm(prev => ({
      ...prev,
      nome_produto: prod.nome,
      categoria_produto: prod.categoria,
      unidade_medida: prod.unidadeMedida.toLowerCase()
    }));
    setMostrarSugestoes(false);
  };

  const handleAddEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    const pId = getPId();
    
    if (!pId) {
      alert("Unidade não identificada. Por favor, faça login novamente.");
      return;
    }

    setSavingAdd(true);
    try {
      const resProduto = await fetch("/api/produtos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-pizzaria-id": pId 
        },
        body: JSON.stringify({
          nome_produto: addForm.nome_produto,
          categoria_produto: addForm.categoria_produto,
          unidade_medida: addForm.unidade_medida
        })
      });

      if (!resProduto.ok) {
        const errorData = await resProduto.json() as { error?: string };
        throw new Error(errorData.error || "Erro ao criar produto.");
      }

      const produtoCriado = (await resProduto.json()) as { id: number };

      const resEstoque = await fetch("/api/estoque", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-pizzaria-id": pId 
        },
        body: JSON.stringify({
          produto_id: produtoCriado.id,
          quantidade_atual: parseFloat(addForm.quantidade_atual) || 0,
          estoque_minimo: parseFloat(addForm.estoque_minimo) || 0
        })
      });

      if (resEstoque.ok) {
        setIsAddDialogOpen(false);
        setAddForm({ nome_produto: "", categoria_produto: "Insumos", unidade_medida: "un", quantidade_atual: "", estoque_minimo: "" });
        await fetchEstoques();
        await fetchProdutos();
      } else {
        const errorData = await resEstoque.json() as { error?: string };
        throw new Error(errorData.error || "Erro ao lançar no estoque físico.");
      }
    } catch (err: any) {
      alert(err.message || "Erro de conexão com o servidor.");
    } finally {
      setSavingAdd(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(auditValue) || 0;
    const newValue = Math.max(0, current + delta);
    setAuditValue(String(newValue));
  };

  if (!mounted) return null;

  const filteredEstoques = estoques.filter((e) => {
    const matchesSearch = (e.produto_nome || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "baixo") return matchesSearch && e.quantidade_atual <= e.estoque_minimo;
    if (filterStatus === "ok") return matchesSearch && e.quantidade_atual > e.estoque_minimo;
    return matchesSearch;
  });

  const estoqueBaixoCount = estoques.filter(e => e.quantidade_atual <= e.estoque_minimo).length;

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] pb-12">
      {/* BACKGROUND BRANDING */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden text-center">
        <div className="flex flex-col items-center justify-center opacity-[0.03] select-none scale-150">
          <BrainCircuit className="w-64 h-64 text-blue-900" />
          <span className="text-[120px] font-black italic uppercase tracking-tighter mt-4 text-blue-900 leading-none">PAPPI.IA</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Gestão de <span className="text-blue-600">Estoque</span></h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-1">Auditoria e Controle Físico</p>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black italic uppercase text-xs tracking-widest shadow-lg shadow-blue-200">
            <Plus size={18} className="mr-2" /> Novo Lançamento
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-[30px] border-none bg-gray-900 text-white shadow-xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Total de Itens</p>
            <p className="text-4xl font-black italic">{estoques.length}</p>
          </Card>
          <Card className={`rounded-[30px] border p-6 ${estoqueBaixoCount > 0 ? "border-red-200 bg-red-50 text-red-600" : "bg-white text-gray-900"}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">Alerta de Estoque</p>
            <p className="text-3xl font-black">{estoqueBaixoCount}</p>
          </Card>
          <Card className="rounded-[30px] border bg-green-50 text-green-600 p-6 border-green-100">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">Estoque OK</p>
            <p className="text-3xl font-black">{estoques.length - estoqueBaixoCount}</p>
          </Card>
        </div>

        {/* FILTROS */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-2 rounded-[30px] border border-gray-100 shadow-sm">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input className="pl-14 h-14 rounded-[24px] border-0 bg-transparent font-bold text-gray-600 w-full focus:ring-0" placeholder="Procurar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48 h-14 border-0 bg-gray-50 rounded-2xl font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="ok">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* GRID DE CARDS */}
        <div className="grid gap-4">
          {filteredEstoques.map((estoque) => (
            <Card key={estoque.id} className="border-gray-100 rounded-[30px] overflow-hidden group hover:shadow-lg transition-all">
              <CardContent className="p-0 flex flex-col sm:flex-row items-center">
                <div className="p-6 flex-1 w-full">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black italic uppercase text-gray-900 text-xl">{estoque.produto_nome}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">{estoque.categoria_produto}</span>
                  </div>
                  <div className="mt-4 flex gap-3 items-center text-3xl font-black italic">
                    <span className={estoque.quantidade_atual <= estoque.estoque_minimo ? 'text-red-600' : 'text-blue-600'}>
                      {estoque.quantidade_atual} <span className="text-xs not-italic text-gray-400 uppercase">{estoque.unidade_medida}</span>
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 w-full sm:w-auto flex justify-center">
                   <Button onClick={() => handleOpenAudit(estoque)} className="h-12 px-6 rounded-2xl bg-white border border-gray-200 text-gray-600 font-black uppercase text-xs hover:bg-blue-50 hover:text-blue-600">
                    <ClipboardCheck size={16} className="mr-2" /> Auditar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MODAL AUDITORIA */}
        <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-lg rounded-[45px] p-8 border-none shadow-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black italic uppercase text-gray-900">Auditar <span className="text-blue-600">Estoque</span></DialogTitle>
              <DialogDescription className="hidden">Ajuste de quantidade física do produto selecionado.</DialogDescription>
            </DialogHeader>
            {selectedEstoque && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-2xl text-center"><div className="font-black italic uppercase text-xl">{selectedEstoque.produto_nome}</div></div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-blue-600 mb-2">Quantidade Atual</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => adjustQuantity(-1)} className="h-16 w-16 rounded-2xl"><Minus size={24}/></Button>
                    <Input type="number" value={auditValue} onChange={(e) => setAuditValue(e.target.value)} className="h-16 text-center text-3xl font-black text-blue-900 bg-blue-50 border-blue-100 rounded-2xl" />
                    <Button variant="outline" onClick={() => adjustQuantity(1)} className="h-16 w-16 rounded-2xl"><Plus size={24}/></Button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Estoque Mínimo</label>
                  <Input type="number" value={auditMinimoValue} onChange={(e) => setAuditMinimoValue(e.target.value)} className="h-12 rounded-xl text-center text-lg font-bold" />
                </div>
                <div className="flex flex-col gap-3 pt-6 border-t">
                  {parseFloat(auditValue) < parseFloat(auditMinimoValue) && (
                    <Button onClick={handleEnviarParaLista} disabled={sendingToLista} className="w-full h-14 rounded-2xl bg-orange-50 text-orange-600 font-black uppercase text-[10px]">
                      {sendingToLista ? <Loader2 className="animate-spin mr-2"/> : <ShoppingCart size={16} className="mr-2"/>} Em falta! Enviar para Compras
                    </Button>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsAuditDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">Cancelar</Button>
                    <Button onClick={handleSaveAudit} disabled={savingAudit} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs">
                      {savingAudit ? <Loader2 className="animate-spin"/> : <Save size={18} className="mr-2"/>} Salvar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL NOVO LANÇAMENTO */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-xl rounded-[45px] p-8 bg-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black italic uppercase">Lançar <span className="text-blue-600">Produto</span></DialogTitle>
              <DialogDescription className="hidden">Cadastre um novo item no catálogo e estoque simultaneamente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEstoque} className="space-y-6">
              <div className="relative space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 italic">Nome do Produto</Label>
                <div className="relative">
                  <Input value={addForm.nome_produto} onChange={(e) => handleNomeChange(e.target.value)} onFocus={() => setMostrarSugestoes(true)} placeholder="Ex: Queijo Mussarela" className="h-14 rounded-2xl font-bold bg-gray-50 border-0 text-lg shadow-inner" autoComplete="off" />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                </div>
                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto p-2 z-[100]">
                    {sugestoes.map((prod) => (
                      <div key={prod.id} onClick={() => selecionarSugestao(prod)} className="flex items-center gap-4 p-3 hover:bg-blue-50 rounded-2xl cursor-pointer transition-colors">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Package size={16}/></div>
                        <div><div className="font-bold text-sm text-gray-900">{prod.nome}</div><div className="text-[10px] uppercase text-gray-400">{prod.categoria}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 italic">Categoria</Label>
                  <Select value={addForm.categoria_produto} onValueChange={(v) => setAddForm({...addForm, categoria_produto: v})}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold bg-gray-50 border-0"><SelectValue/></SelectTrigger>
                    <SelectContent className="rounded-2xl">{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 italic">Unidade</Label>
                  <Select value={addForm.unidade_medida} onValueChange={(v) => setAddForm({...addForm, unidade_medida: v})}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold bg-gray-50 border-0"><SelectValue/></SelectTrigger>
                    <SelectContent className="rounded-2xl">{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-[24px]">
                <div><Label className="text-[9px] font-black uppercase text-blue-800">Qtd Agora</Label><Input type="number" step="0.01" value={addForm.quantidade_atual} onChange={(e) => setAddForm({ ...addForm, quantidade_atual: e.target.value })} className="h-12 rounded-xl text-center font-black" /></div>
                <div><Label className="text-[9px] font-black uppercase text-red-500">Mínimo</Label><Input type="number" step="0.01" value={addForm.estoque_minimo} onChange={(e) => setAddForm({ ...addForm, estoque_minimo: e.target.value })} className="h-12 rounded-xl text-center font-black" /></div>
              </div>
              <div className="flex gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-14 rounded-2xl">Cancelar</Button>
                <Button type="submit" disabled={savingAdd} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black italic uppercase text-xs">
                  {savingAdd ? <Loader2 className="animate-spin"/> : <><PackagePlus size={18} className="mr-2"/> Lançar Produto</>}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

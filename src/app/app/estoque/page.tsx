"use client";

import { useState, useEffect, useCallback } from "react";
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
  BrainCircuit,
  Sparkles,
  PackagePlus,
  Edit2,
  Trash2,
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

interface EstoqueItem {
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

export default function EstoquePage() {
  const [mounted, setMounted] = useState(false);
  const [estoques, setEstoques] = useState<EstoqueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  
  const [auditValue, setAuditValue] = useState("");
  const [auditMinimoValue, setAuditMinimoValue] = useState("");
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

  const getHeaders = useCallback(() => {
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    return {
      "Content-Type": "application/json",
      "x-pizzaria-id": pId
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/estoque", { headers: getHeaders() });
      if (res.ok) setEstoques(await res.json());
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const handleOpenAudit = (item: EstoqueItem) => {
    setSelectedItem(item);
    setAuditValue(String(item.quantidade_atual || 0));
    setAuditMinimoValue(String(item.estoque_minimo || 0));
    setIsAuditDialogOpen(true);
  };

  const handleSaveAudit = async () => {
    if (!selectedItem) return;
    setSavingAudit(true);
    try {
      const res = await fetch(`/api/estoque/${selectedItem.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          quantidade_atual: parseFloat(auditValue) || 0,
          estoque_minimo: parseFloat(auditMinimoValue) || 0,
        }),
      });
      if (res.ok) {
        setIsAuditDialogOpen(false);
        fetchData();
      }
    } catch (err) { alert("Erro de conexão"); } 
    finally { setSavingAudit(false); }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar este item do estoque? Esta ação não pode ser desfeita.")) return;
    
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        fetchData(); // Atualiza a tela após apagar
      } else {
        alert("Erro ao excluir do banco de dados.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  const handleAddEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getHeaders()["x-pizzaria-id"]) return alert("Unidade não identificada.");

    // Trava de Duplicidade
    const jaExiste = estoques.some(item => item.produto_nome?.trim().toLowerCase() === addForm.nome_produto.trim().toLowerCase());
    if (jaExiste) return alert(`O produto "${addForm.nome_produto}" já está no seu estoque! Use o botão de editar.`);

    setSavingAdd(true);
    try {
      const resProd = await fetch("/api/produtos", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ 
          nome_produto: addForm.nome_produto, 
          categoria_produto: addForm.categoria_produto, 
          unidade_medida: addForm.unidade_medida 
        })
      });
      if (!resProd.ok) throw new Error("Erro no catálogo.");
      const prodData = await resProd.json() as { id: number };

      const resEst = await fetch("/api/estoque", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ 
          produto_id: prodData.id, 
          quantidade_atual: parseFloat(addForm.quantidade_atual) || 0, 
          estoque_minimo: parseFloat(addForm.estoque_minimo) || 0 
        })
      });

      if (resEst.ok) {
        setAddForm({ nome_produto: "", categoria_produto: "Insumos", unidade_medida: "un", quantidade_atual: "", estoque_minimo: "" });
        setSugestoes([]);
        setIsAddDialogOpen(false);
        fetchData();
      }
    } catch (err) { alert("Falha ao salvar produto."); } 
    finally { setSavingAdd(false); }
  };

  const handleNomeChange = (value: string) => {
    setAddForm(prev => ({ ...prev, nome_produto: value }));
    if (value.length >= 2) {
      const termoLower = value.toLowerCase();
      setSugestoes(PRODUTOS_FOOD_SERVICE.filter(p => p.nome.toLowerCase().includes(termoLower)));
      setMostrarSugestoes(true);
    } else { setMostrarSugestoes(false); }
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

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(auditValue) || 0;
    setAuditValue(String(Math.max(0, current + delta)));
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

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;

  return (
    <div className="relative min-h-[80vh] pb-12">
      {/* 🤖 MARCA D'ÁGUA IA */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03] select-none scale-150">
        <BrainCircuit className="w-64 h-64 text-blue-900" />
        <span className="text-[120px] font-black italic uppercase tracking-tighter mt-4 text-blue-900 leading-none">PAPPI.IA</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2.5 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 shadow-sm transition-all">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
              Gestão de <span className="text-blue-600">Estoque</span>
            </h1>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black italic uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-transform">
            <Plus size={16} className="mr-2" /> Novo Lançamento
          </Button>
        </div>

        {/* CARDS STATS COMPACTOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-[25px] border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl p-5 relative overflow-hidden">
             <Boxes className="absolute top-0 right-0 p-4 opacity-10 w-16 h-16" />
             <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Total de Itens</p>
             <p className="text-3xl font-black italic">{estoques.length}</p>
          </Card>
          <Card className={`rounded-[25px] border p-5 transition-all ${estoqueBaixoCount > 0 ? "border-red-200 bg-red-50 text-red-600 shadow-md shadow-red-100" : "bg-white text-gray-900 shadow-sm"}`}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1">Alerta de Stock</p>
            <p className="text-3xl font-black">{estoqueBaixoCount}</p>
          </Card>
          <Card className="rounded-[25px] border bg-green-50 text-green-600 p-5 border-green-100 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest mb-1">Stock OK</p>
            <p className="text-3xl font-black">{estoques.length - estoqueBaixoCount}</p>
          </Card>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3">
            <Search className="text-gray-400" size={18} />
            <Input className="border-0 bg-transparent font-bold h-10 text-sm focus-visible:ring-0" placeholder="Procurar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 border-0 bg-gray-50 h-10 rounded-xl text-[10px] font-black uppercase">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="ok">Adequado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LISTAGEM COMPACTA EM LINHAS COM BOTÃO DE EXCLUIR */}
        <div className="grid gap-2">
          {filteredEstoques.map((e) => (
            <div key={e.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between hover:border-blue-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-colors ${e.quantidade_atual <= e.estoque_minimo ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-tight leading-none">{e.produto_nome}</h3>
                  <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">{e.categoria_produto || "Geral"} • {e.unidade_medida}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right mr-2">
                  <p className={`text-xl font-black italic leading-none ${e.quantidade_atual <= e.estoque_minimo ? 'text-red-600' : 'text-blue-600'}`}>
                    {e.quantidade_atual}
                  </p>
                  {e.quantidade_atual <= e.estoque_minimo && <p className="text-[7px] font-black text-red-500 uppercase mt-0.5">Repor!</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button onClick={() => handleOpenAudit(e)} variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 text-blue-600 transition-all">
                    <Edit2 size={16} />
                  </Button>
                  <Button onClick={() => handleDeleteItem(e.id)} variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL AUDITORIA / EDITAR */}
        <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-md rounded-[35px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase text-gray-900">Editar <span className="text-blue-600">Item</span></DialogTitle>
              <DialogDescription className="hidden">Ajuste de quantidade e alerta.</DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                   <p className="font-black italic uppercase text-lg text-gray-900">{selectedItem.produto_nome}</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Unidade: {selectedItem.unidade_medida}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-blue-600 ml-1">Stock Atual</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => adjustQuantity(-1)} className="h-10 w-10 rounded-lg"><Minus size={14}/></Button>
                      <Input type="number" value={auditValue} onChange={(e) => setAuditValue(e.target.value)} className="h-10 text-center font-black text-blue-900 bg-blue-50 border-0 rounded-lg focus-visible:ring-0" />
                      <Button variant="outline" size="sm" onClick={() => adjustQuantity(1)} className="h-10 w-10 rounded-lg"><Plus size={14}/></Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-gray-400 ml-1">Mínimo Alerta</label>
                    <Input type="number" value={auditMinimoValue} onChange={(e) => setAuditMinimoValue(e.target.value)} className="h-10 rounded-lg text-center font-bold bg-gray-50 border-0 focus-visible:ring-0" />
                  </div>
                </div>
                <Button onClick={handleSaveAudit} disabled={savingAudit} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg">
                  {savingAudit ? <Loader2 className="animate-spin"/> : "Guardar Alterações"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL NOVO LANÇAMENTO (IA FOOD SERVICE) */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-md rounded-[35px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase">Novo <span className="text-blue-600">Produto</span></DialogTitle>
              <DialogDescription className="hidden">Cadastrar novo item no catálogo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEstoque} className="space-y-5">
              <div className="relative space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gray-400 italic ml-1">Nome do Produto</Label>
                <div className="relative">
                  <Input value={addForm.nome_produto} onChange={(e) => handleNomeChange(e.target.value)} onFocus={() => setMostrarSugestoes(true)} placeholder="Ex: Queijo Mussarela" className="h-12 rounded-xl font-bold bg-gray-50 border-0 text-sm shadow-inner focus-visible:ring-0" autoComplete="off" />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                </div>
                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto p-1 z-[100]">
                    {sugestoes.map((prod) => (
                      <div key={prod.id} onClick={() => selecionarSugestao(prod)} className="flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors border-b last:border-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Package size={14}/></div>
                        <div><p className="font-bold text-xs text-gray-900">{prod.nome}</p><p className="text-[8px] uppercase text-gray-400">{prod.categoria}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-400 italic ml-1">Categoria</Label>
                    <Select value={addForm.categoria_produto} onValueChange={(v) => setAddForm({...addForm, categoria_produto: v})}>
                      <SelectTrigger className="h-10 rounded-xl font-bold bg-gray-50 border-0 text-xs"><SelectValue/></SelectTrigger>
                      <SelectContent className="rounded-xl">{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-400 italic ml-1">Unidade</Label>
                    <Select value={addForm.unidade_medida} onValueChange={(v) => setAddForm({...addForm, unidade_medida: v})}>
                      <SelectTrigger className="h-10 rounded-xl font-bold bg-gray-50 border-0 text-xs"><SelectValue/></SelectTrigger>
                      <SelectContent className="rounded-xl">{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/30">
                <div><Label className="text-[8px] font-black uppercase text-blue-800 ml-1">Qtd Inicial</Label><Input type="number" step="0.01" value={addForm.quantidade_atual} onChange={(e) => setAddForm({ ...addForm, quantidade_atual: e.target.value })} className="h-10 rounded-lg text-center font-black bg-white border-0 text-sm" /></div>
                <div><Label className="text-[8px] font-black uppercase text-red-500 ml-1">Stock Mínimo</Label><Input type="number" step="0.01" value={addForm.estoque_minimo} onChange={(e) => setAddForm({ ...addForm, estoque_minimo: e.target.value })} className="h-10 rounded-lg text-center font-black bg-white border-0 text-sm" /></div>
              </div>
              <Button type="submit" disabled={savingAdd} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg">
                {savingAdd ? <Loader2 className="animate-spin"/> : <><PackagePlus size={16} className="mr-2"/> Lançar Produto</>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
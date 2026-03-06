"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Label } from "@/react-app/components/ui/label";
import { Badge } from "@/react-app/components/ui/badge";
import type { ItemLancamento } from "@/shared/types";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import type { Lancamento } from "@/shared/types";

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
  Plus,
  Minus,
  ArrowLeft,
  Boxes,
  BrainCircuit,
  Sparkles,
  PackagePlus,
  Trash2,
  DollarSign,
  TrendingDown,
  ClipboardList,
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
  "Congelados e Vegetais", "Mercearia e Condimentos",
];

const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd", "pc", "sc"];

interface EstoqueItem {
  id: number;
  produto_id: number;
  quantidade_atual: number;
  estoque_minimo: number;
  custo_unitario: number; // NOVO CAMPO
  produto_nome?: string;
  categoria_produto?: string;
  unidade_medida?: string;
}

export default function EstoquePage() {
  const [mounted, setMounted] = useState(false);
  const { localUser } = useAppAuth();

  const [estoques, setEstoques] = useState<EstoqueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);

  // Estados para a Auditoria
  const [auditValue, setAuditValue] = useState("");
  const [auditMinimoValue, setAuditMinimoValue] = useState("");
  const [auditCustoValue, setAuditCustoValue] = useState("");
  const [auditMotivo, setAuditMotivo] = useState("Contagem de Rotina");
  const [savingAudit, setSavingAudit] = useState(false);

  const [savingAdd, setSavingAdd] = useState(false);

  const [addForm, setAddForm] = useState({
    nome_produto: "",
    categoria_produto: "Insumos",
    unidade_medida: "un",
    quantidade_atual: "",
    estoque_minimo: "",
    custo_unitario: "",
  });

  const [sugestoes, setSugestoes] = useState<ProdutoFoodService[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // ✅ Header padrão SaaS: empresa + email
  const getHeaders = useCallback(() => {
    const empresaId =
      localStorage.getItem("empresaId") ||
      localStorage.getItem("companyId") ||
      "";

    const email = localUser?.email || localStorage.getItem("userEmail") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-email": email,
    };

    if (empresaId) headers["x-empresa-id"] = empresaId;

    return headers;
  }, [localUser]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/estoque", { headers: getHeaders() });
      if (res.ok) setEstoques(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAudit = (item: EstoqueItem) => {
    setSelectedItem(item);
    setAuditValue(String(item.quantidade_atual || 0));
    setAuditMinimoValue(String(item.estoque_minimo || 0));
    setAuditCustoValue(String(item.custo_unitario || 0));
    setAuditMotivo("Contagem de Rotina");
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
          quantidade_atual: parseFloat(String(auditValue).replace(",", ".")) || 0,
          estoque_minimo: parseFloat(String(auditMinimoValue).replace(",", ".")) || 0,
          custo_unitario: parseFloat(String(auditCustoValue).replace(",", ".")) || 0,
          motivo: auditMotivo, // ✅ se seu backend ignorar, ok; se aceitar, melhor ainda
        }),
      });

      if (res.ok) {
        setIsAuditDialogOpen(false);
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Erro na gravação: ${errData.error || "Falha desconhecida no banco de dados."}`);
      }
    } catch (err) {
      alert("Erro de conexão com o servidor.");
    } finally {
      setSavingAudit(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar este item do estoque? Esta ação não pode ser desfeita.")) return;

    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (res.ok) {
        fetchData();
      } else {
        alert("Erro ao excluir do banco de dados.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  const handleAddEstoque = async (e: React.FormEvent) => {
    e.preventDefault();

    const headers = getHeaders();
    if (!headers["x-empresa-id"]) return alert("Erro: Empresa não identificada.");
    if (!addForm.nome_produto.trim()) return alert("O nome do produto é obrigatório!");

    const jaExiste = estoques.some(
      (item) => item.produto_nome?.trim().toLowerCase() === addForm.nome_produto.trim().toLowerCase()
    );
    if (jaExiste) {
      return alert(`O produto "${addForm.nome_produto}" já está no seu estoque! Use a auditoria para ajustar quantidades e valores.`);
    }

    setSavingAdd(true);

    try {
      // 1) cria produto
      const resProd = await fetch("/api/produtos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          nome_produto: addForm.nome_produto,
          categoria_produto: addForm.categoria_produto,
          unidade_medida: addForm.unidade_medida,
        }),
      });

      const prodData = await resProd.json().catch(() => ({}));
      if (!resProd.ok || !prodData.id) throw new Error(prodData?.error || "Erro ao criar produto no catálogo.");

      // 2) cria estoque
      const resEst = await fetch("/api/estoque", {
        method: "POST",
        headers,
        body: JSON.stringify({
          produto_id: prodData.id,
          quantidade_atual: addForm.quantidade_atual ? parseFloat(addForm.quantidade_atual.replace(",", ".")) : 0,
          estoque_minimo: addForm.estoque_minimo ? parseFloat(addForm.estoque_minimo.replace(",", ".")) : 0,
          custo_unitario: addForm.custo_unitario ? parseFloat(addForm.custo_unitario.replace(",", ".")) : 0,
        }),
      });

      if (resEst.ok) {
        alert("Item adicionado ao estoque com sucesso!");
        setAddForm({
          nome_produto: "",
          categoria_produto: "Insumos",
          unidade_medida: "un",
          quantidade_atual: "",
          estoque_minimo: "",
          custo_unitario: "",
        });
        setSugestoes([]);
        setIsAddDialogOpen(false);
        fetchData();
      } else {
        const errData = await resEst.json().catch(() => ({}));
        alert(errData.error || "Falha ao gravar no estoque.");
      }
    } catch (err: any) {
      alert(err?.message || "Falha ao salvar produto. Verifique sua conexão.");
    } finally {
      setSavingAdd(false);
    }
  };

  const handleNomeChange = (value: string) => {
    setAddForm((prev) => ({ ...prev, nome_produto: value }));

    if (value.length >= 2) {
      const termoLower = value.toLowerCase();
      setSugestoes(PRODUTOS_FOOD_SERVICE.filter((p) => p.nome.toLowerCase().includes(termoLower)));
      setMostrarSugestoes(true);
    } else {
      setMostrarSugestoes(false);
    }
  };

  const selecionarSugestao = (prod: ProdutoFoodService) => {
    setAddForm((prev) => ({
      ...prev,
      nome_produto: prod.nome,
      categoria_produto: prod.categoria,
      unidade_medida: prod.unidadeMedida.toLowerCase(),
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

  const estoqueBaixoCount = estoques.filter((e) => e.quantidade_atual <= e.estoque_minimo).length;

  const valorTotalEstoque = estoques.reduce(
    (acc, item) => acc + (item.quantidade_atual || 0) * (item.custo_unitario || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] pb-12">
      {/* 🤖 MARCA D'ÁGUA IA */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03] select-none scale-150">
        <BrainCircuit className="w-64 h-64 text-blue-900" />
        <span className="text-[120px] font-black italic uppercase tracking-tighter mt-4 text-blue-900 leading-none">
          PAPPI.IA
        </span>
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="p-2.5 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 shadow-sm transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                Estoque <span className="text-blue-600">Premium</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Inventário e Auditoria Financeira
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black italic uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-transform"
          >
            <Plus size={18} className="mr-2" /> Novo Lançamento
          </Button>
        </div>

        {/* CARDS STATS FINANCEIROS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-[25px] border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl p-5 relative overflow-hidden md:col-span-2">
            <DollarSign className="absolute top-0 right-0 p-4 opacity-10 w-24 h-24" />
            <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">
              Capital Investido no Estoque
            </p>
            <p className="text-4xl font-black italic">{formatCurrency(valorTotalEstoque)}</p>
          </Card>

          <Card className="rounded-[25px] border p-5 bg-white text-gray-900 shadow-sm flex flex-col justify-center">
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-gray-400">Total de SKUs</p>
            <p className="text-3xl font-black">
              {estoques.length} <span className="text-sm text-gray-400">Itens</span>
            </p>
          </Card>

          <Card
            className={`rounded-[25px] border p-5 flex flex-col justify-center transition-all ${
              estoqueBaixoCount > 0
                ? "border-red-200 bg-red-50 text-red-600 shadow-md shadow-red-100"
                : "bg-green-50 border-green-100 text-green-600 shadow-sm"
            }`}
          >
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
              {estoqueBaixoCount > 0 ? <AlertTriangle size={12} /> : <Package size={12} />}
              {estoqueBaixoCount > 0 ? "Itens em Alerta" : "Estoque Saudável"}
            </p>
            <p className="text-3xl font-black">{estoqueBaixoCount > 0 ? estoqueBaixoCount : "100%"}</p>
          </Card>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-wrap md:flex-nowrap gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 min-w-[200px]">
            <Search className="text-gray-400" size={18} />
            <Input
              className="border-0 bg-transparent font-bold h-12 text-sm focus-visible:ring-0"
              placeholder="Procurar produto no estoque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40 border-0 bg-gray-50 h-12 rounded-xl text-xs font-black uppercase focus:ring-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos os Itens</SelectItem>
              <SelectItem value="baixo">Abaixo do Mínimo</SelectItem>
              <SelectItem value="ok">Quantidade OK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LISTAGEM FINANCEIRA */}
        <div className="grid gap-3">
          {filteredEstoques.map((e) => {
            const isBaixo = e.quantidade_atual <= e.estoque_minimo;
            const valorTotalItem = (e.quantidade_atual || 0) * (e.custo_unitario || 0);

            return (
              <div
                key={e.id}
                className={`bg-white border-2 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between transition-all group ${
                  isBaixo ? "border-red-100" : "border-transparent hover:border-blue-100 shadow-sm"
                }`}
              >
                {/* Info do Produto */}
                <div className="flex items-center gap-4 mb-4 md:mb-0 md:w-1/3">
                  <div className={`p-3 rounded-xl transition-colors ${isBaixo ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-gray-900 uppercase tracking-tight">{e.produto_nome}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{e.categoria_produto || "Geral"}</p>
                  </div>
                </div>

                {/* Valores Financeiros */}
                <div className="flex items-center justify-between md:w-1/3 px-4 border-x border-gray-50 mb-4 md:mb-0">
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Custo Médio</p>
                    <p className="font-bold text-gray-700 text-sm">
                      {formatCurrency(e.custo_unitario)}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">/ {e.unidade_medida}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Total em Caixa</p>
                    <p className="font-black text-green-600 text-sm italic">{formatCurrency(valorTotalItem)}</p>
                  </div>
                </div>

                {/* Quantidades e Ações */}
                <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Prateleira</p>
                    <div className="flex items-baseline gap-1 justify-end">
                      <p className={`text-2xl font-black italic leading-none ${isBaixo ? "text-red-600" : "text-gray-900"}`}>
                        {e.quantidade_atual}
                      </p>
                      <span className="text-xs font-bold text-gray-500">{e.unidade_medida}</span>
                    </div>
                    {isBaixo && (
                      <p className="text-[8px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">
                        Comprar!
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleOpenAudit(e)}
                      className="h-12 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm transition-all font-bold text-xs"
                    >
                      <ClipboardList size={16} className="mr-2" /> Auditar
                    </Button>
                    <Button
                      onClick={() => handleDeleteItem(e.id)}
                      variant="ghost"
                      className="h-12 w-12 p-0 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredEstoques.length === 0 && !isLoading && (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm">
              <Boxes size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-black uppercase text-sm tracking-widest">Estoque Vazio</p>
              <p className="text-gray-400 text-xs mt-2">Dê entrada nos seus produtos para calcular o patrimônio.</p>
            </div>
          )}
        </div>

        {/* MODAL DE AUDITORIA */}
        <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-lg rounded-[35px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase text-gray-900 flex items-center gap-2">
                <ClipboardList className="text-blue-600" /> Auditoria de <span className="text-blue-600">Estoque</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Ajuste físico e atualização de custos
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-6 mt-2">
                <div className="p-5 bg-gray-900 rounded-2xl flex justify-between items-center text-white shadow-lg">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Produto</p>
                    <p className="font-black text-lg mt-1">{selectedItem.produto_nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sistema (Atual)</p>
                    <p className="font-black text-2xl italic text-blue-400">
                      {selectedItem.quantidade_atual}{" "}
                      <span className="text-sm text-gray-500">{selectedItem.unidade_medida}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Contagem Física Real</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => adjustQuantity(-1)} className="h-12 w-12 rounded-xl bg-gray-50 border-0 hover:bg-gray-200">
                        <Minus size={16} />
                      </Button>
                      <Input
                        type="number"
                        step="0.01"
                        value={auditValue}
                        onChange={(e) => setAuditValue(e.target.value)}
                        className="h-12 text-center font-black text-lg bg-gray-50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <Button variant="outline" onClick={() => adjustQuantity(1)} className="h-12 w-12 rounded-xl bg-gray-50 border-0 hover:bg-gray-200">
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Atualizar Custo ({selectedItem.unidade_medida})</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                      <Input
                        type="number"
                        step="0.01"
                        value={auditCustoValue}
                        onChange={(e) => setAuditCustoValue(e.target.value)}
                        className="h-12 pl-10 font-bold bg-green-50/50 border-green-100 rounded-xl focus-visible:ring-1 focus-visible:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Alerta de Falta (Mínimo)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={auditMinimoValue}
                      onChange={(e) => setAuditMinimoValue(e.target.value)}
                      className="h-12 text-center font-bold bg-gray-50 border-0 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Motivo do Ajuste</Label>
                    <Select value={auditMotivo} onValueChange={setAuditMotivo}>
                      <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl font-bold text-xs focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Contagem de Rotina">Contagem de Rotina</SelectItem>
                        <SelectItem value="Quebra/Perda">Quebra ou Perda</SelectItem>
                        <SelectItem value="Vencimento">Produto Vencido</SelectItem>
                        <SelectItem value="Entrada de Nota">Correção de Nota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {parseFloat(String(auditValue).replace(",", ".")) !== selectedItem.quantidade_atual && (
                  <div
                    className={`p-4 rounded-xl flex items-center gap-3 border ${
                      parseFloat(String(auditValue).replace(",", ".")) < selectedItem.quantidade_atual
                        ? "bg-red-50 border-red-100 text-red-700"
                        : "bg-green-50 border-green-100 text-green-700"
                    }`}
                  >
                    <TrendingDown
                      size={20}
                      className={parseFloat(String(auditValue).replace(",", ".")) > selectedItem.quantidade_atual ? "rotate-180" : ""}
                    />
                    <div>
                      <p className="font-black text-sm uppercase tracking-widest">
                        Diferença de{" "}
                        {Math.abs(parseFloat(String(auditValue).replace(",", ".")) - selectedItem.quantidade_atual)}{" "}
                        {selectedItem.unidade_medida}
                      </p>
                      <p className="text-xs font-medium opacity-80 mt-0.5">
                        Impacto Financeiro:{" "}
                        {formatCurrency(
                          Math.abs(
                            (parseFloat(String(auditValue).replace(",", ".")) - selectedItem.quantidade_atual) *
                              parseFloat(String(auditCustoValue).replace(",", "."))
                          )
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveAudit}
                  disabled={savingAudit}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all mt-4"
                >
                  {savingAudit ? <Loader2 className="animate-spin" /> : "Registrar Auditoria"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL NOVO LANÇAMENTO */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-md rounded-[35px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase">
                Entrada de <span className="text-blue-600">Estoque</span>
              </DialogTitle>
              <DialogDescription className="hidden">Cadastrar novo item no catálogo e estoque.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddEstoque} className="space-y-5 mt-2">
              <div className="relative space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gray-500 ml-1">Nome do Produto</Label>
                <div className="relative">
                  <Input
                    value={addForm.nome_produto}
                    onChange={(e) => handleNomeChange(e.target.value)}
                    onFocus={() => setMostrarSugestoes(true)}
                    placeholder="Ex: Queijo Mussarela"
                    className="h-12 rounded-xl font-bold bg-gray-50 border-0 text-sm shadow-inner focus-visible:ring-0"
                    autoComplete="off"
                  />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                </div>

                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto p-1 z-[100]">
                    {sugestoes.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => selecionarSugestao(prod)}
                        className="flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors border-b last:border-0"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          <Package size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-900">{prod.nome}</p>
                          <p className="text-[8px] uppercase text-gray-400">{prod.categoria}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-gray-500 ml-1">Categoria</Label>
                  <Select value={addForm.categoria_produto} onValueChange={(v) => setAddForm({ ...addForm, categoria_produto: v })}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-gray-50 border-0 text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-gray-500 ml-1">Unidade</Label>
                  <Select value={addForm.unidade_medida} onValueChange={(v) => setAddForm({ ...addForm, unidade_medida: v })}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-gray-50 border-0 text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {UNIDADES.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-green-600 ml-1">Custo Unitário da Fatura (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                  <Input
                    type="number"
                    step="0.01"
                    value={addForm.custo_unitario}
                    onChange={(e) => setAddForm({ ...addForm, custo_unitario: e.target.value })}
                    className="h-12 pl-12 rounded-xl font-black bg-green-50/50 border-green-100 text-green-800 focus-visible:ring-1 focus-visible:ring-green-400"
                    placeholder="Ex: 38.85"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30">
                <div>
                  <Label className="text-[8px] font-black uppercase text-blue-800 ml-1">Qtd Entrada</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={addForm.quantidade_atual}
                    onChange={(e) => setAddForm({ ...addForm, quantidade_atual: e.target.value })}
                    className="h-12 rounded-xl text-center font-black bg-white border-0 text-sm focus-visible:ring-1 focus-visible:ring-blue-300"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[8px] font-black uppercase text-red-500 ml-1">Alerta Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={addForm.estoque_minimo}
                    onChange={(e) => setAddForm({ ...addForm, estoque_minimo: e.target.value })}
                    className="h-12 rounded-xl text-center font-black bg-white border-0 text-sm focus-visible:ring-1 focus-visible:ring-red-300"
                    placeholder="0"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingAdd}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform mt-2"
              >
                {savingAdd ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <PackagePlus size={18} className="mr-2" /> Gravar no Estoque
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
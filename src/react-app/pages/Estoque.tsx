"use client";

import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";

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
  quantidade_caixas?: number;
  unidades_por_caixa?: number;
  produto_nome?: string;
  categoria_produto?: string;
  unidade_medida?: string;
  data_validade?: string;
  lote?: string;
  status_validade?: 'vencido' | 'vencendo' | 'ok';
}

interface EstoqueComProduto extends Estoque {
  produto?: Produto;
}

export default function EstoquePage() {
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
  const [auditCaixasValue, setAuditCaixasValue] = useState("");
  const [auditUnidadesPorCaixaValue, setAuditUnidadesPorCaixaValue] = useState("");
  const [sendingToLista, setSendingToLista] = useState(false);

  const [addForm, setAddForm] = useState({
    produto_id: "",
    quantidade_atual: "0",
    estoque_minimo: "0",
    data_validade: "",
    lote: "",
    quantidade_caixas: "0",
    unidades_por_caixa: "1",
  });

  const fetchEstoques = async () => {
    const pId = localStorage.getItem("pId") || "";
    try {
      const res = await fetch("/api/estoque", { headers: { "x-pizzaria-id": pId } });
      if (res.ok) {
        const data = (await res.json()) as EstoqueComProduto[];
        setEstoques(data);
      }
    } catch (err) {
      console.error("Erro ao buscar estoque:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProdutos = async () => {
    const pId = localStorage.getItem("pId") || "";
    try {
      const res = await fetch("/api/produtos", { headers: { "x-pizzaria-id": pId } });
      if (res.ok) {
        const data = (await res.json()) as Produto[];
        setProdutos(data);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    }
  };

  useEffect(() => {
    fetchEstoques();
    fetchProdutos();
  }, []);

  function handleOpenAudit(estoque: EstoqueComProduto) {
    setSelectedEstoque(estoque);
    setAuditValue(String(estoque.quantidade_atual || 0));
    setAuditMinimoValue(String(estoque.estoque_minimo || 0));
    setAuditValidadeValue(estoque.data_validade || "");
    setAuditLoteValue(estoque.lote || "");
    setAuditCaixasValue(String(estoque.quantidade_caixas || 0));
    setAuditUnidadesPorCaixaValue(String(estoque.unidades_por_caixa || 1));
    setIsAuditDialogOpen(true);
  }

  const handleSaveAudit = async () => {
    if (!selectedEstoque) return;
    const pId = localStorage.getItem("pId") || "";

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
          quantidade_caixas: parseInt(auditCaixasValue) || 0,
          unidades_por_caixa: parseInt(auditUnidadesPorCaixaValue) || 1,
        }),
      });

      if (res.ok) {
        setIsAuditDialogOpen(false);
        setSelectedEstoque(null);
        fetchEstoques();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Erro ao atualizar estoque");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleEnviarParaLista = async () => {
    if (!selectedEstoque) return;
    const pId = localStorage.getItem("pId") || "";
    
    setSendingToLista(true);
    try {
      const quantidadeSolicitar = Math.max(
        parseFloat(auditMinimoValue) - parseFloat(auditValue),
        1
      );

      const res = await fetch("/api/lista-compras", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-pizzaria-id": pId
        },
        body: JSON.stringify({
          produto_id: selectedEstoque.produto_id,
          quantidade_solicitada: quantidadeSolicitar,
          unidade: selectedEstoque.unidade_medida || "un",
          observacao: `Solicitado via auditoria. Estoque atual: ${auditValue}`,
        }),
      });

      if (res.ok) {
        alert(`${selectedEstoque.produto_nome} enviado para compras!`);
        setIsAuditDialogOpen(false);
        setSelectedEstoque(null);
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Erro ao enviar para lista");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setSendingToLista(false);
    }
  };

  const handleAddEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    const pId = localStorage.getItem("pId") || "";

    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-pizzaria-id": pId
        },
        body: JSON.stringify({
          produto_id: parseInt(addForm.produto_id),
          quantidade_atual: parseFloat(addForm.quantidade_atual) || 0,
          estoque_minimo: parseFloat(addForm.estoque_minimo) || 0,
          data_validade: addForm.data_validade || null,
          lote: addForm.lote || null,
          quantidade_caixas: parseInt(addForm.quantidade_caixas) || 0,
          unidades_por_caixa: parseInt(addForm.unidades_por_caixa) || 1,
        }),
      });

      if (res.ok) {
        setIsAddDialogOpen(false);
        setAddForm({ produto_id: "", quantidade_atual: "0", estoque_minimo: "0", data_validade: "", lote: "", quantidade_caixas: "0", unidades_por_caixa: "1" });
        fetchEstoques();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Erro ao adicionar produto");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(auditValue) || 0;
    const newValue = Math.max(0, current + delta);
    setAuditValue(String(newValue));
  };

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Auditoria de Estoque</h1>
          <p className="text-sm text-gray-600">Controle e ajuste as quantidades físicas</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
          disabled={produtos.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar ao Estoque
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total de Itens</p>
              <p className="text-xl font-bold">{estoques.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={estoqueBaixoCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="py-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${estoqueBaixoCount > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <AlertTriangle className={`w-5 h-5 ${estoqueBaixoCount > 0 ? "text-red-600" : "text-green-600"}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Estoque Baixo</p>
              <p className={`text-xl font-bold ${estoqueBaixoCount > 0 ? "text-red-600" : "text-green-600"}`}>{estoqueBaixoCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Estoque OK</p>
              <p className="text-xl font-bold text-green-600">{estoques.length - estoqueBaixoCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
            <SelectItem value="ok">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-center">Quantidade</th>
                <th className="hidden md:table-cell px-4 py-3 text-center">Mínimo</th>
                <th className="hidden md:table-cell px-4 py-3 text-center">Validade</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEstoques.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.produto_nome}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${item.quantidade_atual <= item.estoque_minimo ? 'text-red-600' : ''}`}>
                      {item.quantidade_atual} {item.unidade_medida}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-center text-gray-500">
                    {item.estoque_minimo}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-center">
                    {item.data_validade ? new Date(item.data_validade).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenAudit(item)}>
                      <ClipboardCheck className="w-4 h-4 mr-1" /> Auditar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de Auditoria */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Auditar: {selectedEstoque?.produto_nome}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <Button variant="outline" size="icon" onClick={() => adjustQuantity(-1)}><Minus /></Button>
                <div className="text-center">
                    <span className="text-2xl font-bold">{auditValue}</span>
                    <p className="text-xs text-gray-500">{selectedEstoque?.unidade_medida}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => adjustQuantity(1)}><Plus /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium">Estoque Mínimo</label>
                    <Input type="number" value={auditMinimoValue} onChange={(e) => setAuditMinimoValue(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Validade</label>
                    <Input type="date" value={auditValidadeValue} onChange={(e) => setAuditValidadeValue(e.target.value)} />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Button onClick={handleSaveAudit} className="w-full bg-orange-600"><Save className="mr-2 h-4 w-4"/>Salvar Ajuste</Button>
                <Button variant="outline" onClick={handleEnviarParaLista} disabled={sendingToLista} className="w-full text-blue-600 border-blue-200">
                    {sendingToLista ? <Loader2 className="animate-spin h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4"/>}
                    Enviar para Compras
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Item no Estoque</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEstoque} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-medium">Produto</label>
                <Select value={addForm.produto_id} onValueChange={(v) => setAddForm({...addForm, produto_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        {produtos.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome_produto}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Qtd Inicial" value={addForm.quantidade_atual} onChange={(e) => setAddForm({...addForm, quantidade_atual: e.target.value})} />
                <Input type="number" placeholder="Mínimo" value={addForm.estoque_minimo} onChange={(e) => setAddForm({...addForm, estoque_minimo: e.target.value})} />
            </div>
            <Button type="submit" className="w-full bg-orange-600">Adicionar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
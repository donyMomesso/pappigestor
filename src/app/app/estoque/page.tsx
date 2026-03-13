"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
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
  status_validade?: "vencido" | "vencendo" | "ok";
}

interface EstoqueComProduto extends Estoque {
  produto?: Produto;
}

export default function EstoquePage() {
  const [estoques, setEstoques] = useState<EstoqueComProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
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
  const [savingAdd, setSavingAdd] = useState(false);

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
    try {
      setIsLoading(true);
      const res = await fetch("/api/estoque", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setEstoques(Array.isArray(data) ? data : []);
      } else {
        setEstoques([]);
      }
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
      setEstoques([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoadingProdutos(true);
      const res = await fetch("/api/produtos", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProdutos(Array.isArray(data) ? data : []);
      } else {
        setProdutos([]);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  };

  useEffect(() => {
    void fetchEstoques();
    void fetchProdutos();
  }, []);

  const handleOpenAudit = (estoque: EstoqueComProduto) => {
    setSelectedEstoque(estoque);
    setAuditValue(String(estoque.quantidade_atual || 0));
    setAuditMinimoValue(String(estoque.estoque_minimo || 0));
    setAuditValidadeValue(estoque.data_validade || "");
    setAuditLoteValue(estoque.lote || "");
    setAuditCaixasValue(String(estoque.quantidade_caixas || 0));
    setAuditUnidadesPorCaixaValue(String(estoque.unidades_por_caixa || 1));
    setIsAuditDialogOpen(true);
  };

  const handleSaveAudit = async () => {
    if (!selectedEstoque) return;

    try {
      const res = await fetch(`/api/estoque/${selectedEstoque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
        await fetchEstoques();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao atualizar estoque");
      }
    } catch {
      alert("Erro de conexão");
    }
  };

  const handleEnviarParaLista = async () => {
    if (!selectedEstoque) return;

    setSendingToLista(true);
    try {
      const quantidadeSolicitar = Math.max(
        parseFloat(auditMinimoValue) - parseFloat(auditValue),
        1
      );

      const res = await fetch("/api/lista-compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: selectedEstoque.produto_id,
          quantidade_solicitada: quantidadeSolicitar,
          unidade: selectedEstoque.unidade_medida || "un",
          observacao: `Solicitado via auditoria de estoque. Estoque atual: ${auditValue} ${selectedEstoque.unidade_medida || "un"}`,
        }),
      });

      if (res.ok) {
        alert(
          `${selectedEstoque.produto_nome} adicionado à lista de compras com ${quantidadeSolicitar} ${selectedEstoque.unidade_medida || "un"}`
        );
        setIsAuditDialogOpen(false);
        setSelectedEstoque(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Não foi possível adicionar à lista de compras");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSendingToLista(false);
    }
  };

  const handleAddEstoque = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!addForm.produto_id) {
      alert("Selecione um produto.");
      return;
    }

    try {
      setSavingAdd(true);

      const payload = {
        produto_id: parseInt(addForm.produto_id),
        quantidade_atual: parseFloat(addForm.quantidade_atual) || 0,
        estoque_minimo: parseFloat(addForm.estoque_minimo) || 0,
        data_validade: addForm.data_validade || null,
        lote: addForm.lote || null,
        quantidade_caixas: parseInt(addForm.quantidade_caixas) || 0,
        unidades_por_caixa: parseInt(addForm.unidades_por_caixa) || 1,
      };

      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Erro ao adicionar produto ao estoque");
        return;
      }

      setIsAddDialogOpen(false);
      setAddForm({
        produto_id: "",
        quantidade_atual: "0",
        estoque_minimo: "0",
        data_validade: "",
        lote: "",
        quantidade_caixas: "0",
        unidades_por_caixa: "1",
      });

      await fetchEstoques();
      await fetchProdutos();

      alert("Produto lançado no estoque com sucesso.");
    } catch (err) {
      console.error("Erro ao adicionar estoque:", err);
      alert("Erro de conexão");
    } finally {
      setSavingAdd(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(auditValue) || 0;
    const newValue = Math.max(0, current + delta);
    setAuditValue(String(newValue));
  };

  const produtosDisponiveis = produtos;

  const filteredEstoques = estoques.filter((e) => {
    const matchesSearch = (e.produto_nome || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "baixo") {
      return matchesSearch && e.quantidade_atual <= e.estoque_minimo;
    }
    if (filterStatus === "ok") {
      return matchesSearch && e.quantidade_atual > e.estoque_minimo;
    }
    return matchesSearch;
  });

  const estoqueBaixoCount = estoques.filter(
    (e) => e.quantidade_atual <= e.estoque_minimo
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Auditoria de Estoque</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Controle e ajuste as quantidades em estoque
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setIsAddDialogOpen(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar ao Estoque
        </Button>
      </div>

      {produtosDisponiveis.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nenhum produto foi carregado para seleção. Verifique a rota <strong>/api/produtos</strong>.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Itens</p>
                <p className="text-xl font-bold text-gray-900">{estoques.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={estoqueBaixoCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  estoqueBaixoCount > 0 ? "bg-red-100" : "bg-green-100"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    estoqueBaixoCount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estoque Baixo</p>
                <p
                  className={`text-xl font-bold ${
                    estoqueBaixoCount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {estoqueBaixoCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estoque OK</p>
                <p className="text-xl font-bold text-green-600">
                  {estoques.length - estoqueBaixoCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto..."
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="baixo">Estoque Baixo</SelectItem>
            <SelectItem value="ok">Estoque OK</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEstoques.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterStatus !== "all"
                ? "Nenhum item encontrado"
                : "Nenhum produto no estoque. Adicione produtos para começar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Produto
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Categoria
                </th>
                <th className="px-2 md:px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Qtd
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Mínimo
                </th>
                <th className="hidden xl:table-cell px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Lote
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Validade
                </th>
                <th className="px-2 md:px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-2 md:px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredEstoques.map((estoque) => {
                const isBaixo = estoque.quantidade_atual <= estoque.estoque_minimo;
                const validadeStatus = estoque.status_validade;
                const isVencido = validadeStatus === "vencido";
                const isVencendo = validadeStatus === "vencendo";

                return (
                  <tr
                    key={estoque.id}
                    className={`hover:bg-gray-50 ${
                      isVencido
                        ? "bg-red-50"
                        : isVencendo
                        ? "bg-amber-50"
                        : isBaixo
                        ? "bg-red-50"
                        : ""
                    }`}
                  >
                    <td className="px-3 md:px-4 py-3">
                      <span className="font-medium text-gray-900 text-sm md:text-base">
                        {estoque.produto_nome}
                      </span>
                      {estoque.categoria_produto && (
                        <span className="lg:hidden block text-xs text-orange-600 mt-0.5">
                          {estoque.categoria_produto}
                        </span>
                      )}
                    </td>

                    <td className="hidden lg:table-cell px-4 py-3">
                      {estoque.categoria_produto && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {estoque.categoria_produto}
                        </span>
                      )}
                    </td>

                    <td className="px-2 md:px-4 py-3 text-center">
                      <span
                        className={`font-bold text-sm md:text-base ${
                          isBaixo ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {estoque.quantidade_atual}
                        <span className="hidden sm:inline"> {estoque.unidade_medida}</span>
                      </span>

                      {(estoque.quantidade_caixas ?? 0) > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {estoque.quantidade_caixas} cx
                        </div>
                      )}
                    </td>

                    <td className="hidden md:table-cell px-4 py-3 text-center text-gray-600">
                      {estoque.estoque_minimo} {estoque.unidade_medida}
                    </td>

                    <td className="hidden xl:table-cell px-4 py-3 text-center text-gray-600 text-sm">
                      {estoque.lote || "-"}
                    </td>

                    <td className="hidden md:table-cell px-4 py-3 text-center">
                      {estoque.data_validade ? (
                        <span
                          className={`text-sm font-medium ${
                            isVencido
                              ? "text-red-600"
                              : isVencendo
                              ? "text-amber-600"
                              : "text-gray-600"
                          }`}
                        >
                          {new Date(estoque.data_validade).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-2 md:px-4 py-3 text-center">
                      {isVencido ? (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 md:px-2 py-1 rounded-full bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="hidden sm:inline">Vencido</span>
                        </span>
                      ) : isVencendo ? (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 md:px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="hidden sm:inline">Vencendo</span>
                        </span>
                      ) : isBaixo ? (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 md:px-2 py-1 rounded-full bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="hidden sm:inline">Baixo</span>
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 md:px-2 py-1 rounded-full bg-green-100 text-green-700">
                          OK
                        </span>
                      )}
                    </td>

                    <td className="px-2 md:px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 md:px-3"
                        onClick={() => handleOpenAudit(estoque)}
                      >
                        <ClipboardCheck className="w-4 h-4 md:mr-1" />
                        <span className="hidden md:inline">Auditar</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auditar Estoque</DialogTitle>
          </DialogHeader>

          {selectedEstoque && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedEstoque.produto_nome}</p>
                <p className="text-sm text-gray-500">
                  Unidade: {selectedEstoque.unidade_medida || "un"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Atual
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustQuantity(-1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={auditValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAuditValue(e.target.value)}
                    className="text-center text-lg font-bold"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustQuantity(1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Mínimo
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={auditMinimoValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setAuditMinimoValue(e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lote</label>
                  <Input
                    value={auditLoteValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAuditLoteValue(e.target.value)}
                    placeholder="Ex: LOTE001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Validade
                  </label>
                  <Input
                    type="date"
                    value={auditValidadeValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAuditValidadeValue(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de Caixas
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={auditCaixasValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAuditCaixasValue(e.target.value)
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidades por Caixa
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={auditUnidadesPorCaixaValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAuditUnidadesPorCaixaValue(e.target.value)
                    }
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEnviarParaLista}
                  disabled={sendingToLista}
                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {sendingToLista ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-2" />
                  )}
                  Enviar para Lista de Compras
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAuditDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleSaveAudit}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => setIsAddDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Estoque</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddEstoque} className="space-y-4 mt-4">
            {loadingProdutos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto *
                  </label>
                  <Select
                    value={addForm.produto_id}
                    onValueChange={(v: string) => setAddForm({ ...addForm, produto_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosDisponiveis.length > 0 ? (
                        produtosDisponiveis.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nome_produto}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Nenhum produto cadastrado
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Atual
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addForm.quantidade_atual}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAddForm({ ...addForm, quantidade_atual: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addForm.estoque_minimo}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAddForm({ ...addForm, estoque_minimo: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                    <Input
                      value={addForm.lote}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAddForm({ ...addForm, lote: e.target.value })
                      }
                      placeholder="Ex: LOTE001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Validade
                    </label>
                    <Input
                      type="date"
                      value={addForm.data_validade}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAddForm({ ...addForm, data_validade: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade de Caixas
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={addForm.quantidade_caixas}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAddForm({ ...addForm, quantidade_caixas: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidades por Caixa
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={addForm.unidades_por_caixa}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAddForm({ ...addForm, unidades_por_caixa: e.target.value })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={savingAdd}
                  >
                    {savingAdd ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
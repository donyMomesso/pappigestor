"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Package,
  Loader2,
  Search,
  Plus,
  Minus,
  ArrowLeft,
  Boxes,
  Sparkles,
  PackagePlus,
  Trash2,
  DollarSign,
  ClipboardList,
  ShoppingCart,
  Save,
  ShieldAlert,
  Archive,
} from "lucide-react";

interface Produto {
  id: string;
  nome?: string;
  categoria?: string | null;
  unidade?: string | null;
  nome_produto?: string;
  categoria_produto?: string | null;
  unidade_medida?: string | null;
}

interface Estoque {
  id: string;
  produto_id: string;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number | null;
  ponto_reposicao?: number | null;
  custo_medio?: number | null;
  custo_unitario?: number | null;
  valor_estoque?: number | null;
  abaixo_minimo?: boolean;
  abaixo_ponto_reposicao?: boolean;
  produto_nome?: string;
  categoria_produto?: string | null;
  unidade_medida?: string | null;
  data_validade?: string | null;
  lote?: string | null;
  quantidade_caixas?: number | null;
  unidades_por_caixa?: number | null;
  ultima_movimentacao_em?: string | null;
  ativo?: boolean;
  observacao?: string | null;
}

interface EstoqueComProduto extends Estoque {
  produto?: Produto | null;
}

interface AddFormState {
  produto_id: string;
  quantidade_atual: string;
  estoque_minimo: string;
  custo_unitario: string;
  data_validade: string;
  lote: string;
  quantidade_caixas: string;
  unidades_por_caixa: string;
}

function getProdutoNome(produto?: Produto | null) {
  return produto?.nome || produto?.nome_produto || "Produto sem nome";
}

function getProdutoCategoria(produto?: Produto | null) {
  return produto?.categoria || produto?.categoria_produto || "Geral";
}

function getProdutoUnidade(produto?: Produto | null) {
  return produto?.unidade || produto?.unidade_medida || "un";
}

function getEstoqueNome(item: EstoqueComProduto) {
  return item.produto_nome || getProdutoNome(item.produto);
}

function getEstoqueCategoria(item: EstoqueComProduto) {
  return item.categoria_produto || getProdutoCategoria(item.produto);
}

function getEstoqueUnidade(item: EstoqueComProduto) {
  return item.unidade_medida || getProdutoUnidade(item.produto);
}

export default function EstoquePage() {
  const { localUser } = useAppAuth();

  const [estoques, setEstoques] = useState<EstoqueComProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEstoque, setSelectedEstoque] =
    useState<EstoqueComProduto | null>(null);

  const [auditValue, setAuditValue] = useState("");
  const [auditMinimoValue, setAuditMinimoValue] = useState("");
  const [auditValidadeValue, setAuditValidadeValue] = useState("");
  const [auditLoteValue, setAuditLoteValue] = useState("");
  const [auditCaixasValue, setAuditCaixasValue] = useState("");
  const [auditUnidadesPorCaixaValue, setAuditUnidadesPorCaixaValue] =
    useState("");
  const [savingAudit, setSavingAudit] = useState(false);

  const [sendingToLista, setSendingToLista] = useState(false);
  const [gerandoListaAuto, setGerandoListaAuto] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  const [addForm, setAddForm] = useState<AddFormState>({
    produto_id: "",
    quantidade_atual: "0",
    estoque_minimo: "0",
    custo_unitario: "0",
    data_validade: "",
    lote: "",
    quantidade_caixas: "0",
    unidades_por_caixa: "1",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getEmpresaId = useCallback(() => {
    if (typeof window === "undefined") return "";

    return (
      localStorage.getItem("pId") ||
      localStorage.getItem("empresaId") ||
      localStorage.getItem("companyId") ||
      localStorage.getItem("empresa_id") ||
      localUser?.empresa_id ||
      ""
    );
  }, [localUser]);

  const getHeaders = useCallback(() => {
    const empresaId = getEmpresaId();
    const email = localUser?.email || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (empresaId) headers["x-empresa-id"] = empresaId;
    if (email) headers["x-user-email"] = email;

    return headers;
  }, [getEmpresaId, localUser]);

  const toNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return 0;
    const parsed = parseFloat(String(value).replace(",", "."));
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const fetchEstoques = useCallback(async () => {
    const pId = getEmpresaId();

    if (!pId) {
      console.error("Empresa não encontrada no navegador.");
      setEstoques([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch("/api/estoque", {
        headers: {
          ...getHeaders(),
          "x-empresa-id": pId,
        },
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao buscar estoque:", data);
        setEstoques([]);
        return;
      }

      setEstoques(Array.isArray(data) ? (data as EstoqueComProduto[]) : []);
    } catch (err) {
      console.error("Erro ao buscar estoque:", err);
      setEstoques([]);
    } finally {
      setIsLoading(false);
    }
  }, [getEmpresaId, getHeaders]);

  const fetchProdutos = useCallback(async () => {
    const pId = getEmpresaId();

    if (!pId) {
      console.error("Empresa não encontrada no navegador para buscar produtos.");
      setProdutos([]);
      return;
    }

    try {
      const res = await fetch("/api/produtos", {
        headers: {
          ...getHeaders(),
          "x-empresa-id": pId,
        },
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao buscar produtos:", data);
        setProdutos([]);
        return;
      }

      setProdutos(Array.isArray(data) ? (data as Produto[]) : []);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setProdutos([]);
    }
  }, [getEmpresaId, getHeaders]);

  useEffect(() => {
    if (!mounted) return;
    fetchEstoques();
    fetchProdutos();
  }, [mounted, fetchEstoques, fetchProdutos]);

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

    const pId = getEmpresaId();

    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setSavingAudit(true);

    try {
      const res = await fetch("/api/estoque/ajustar", {
        method: "POST",
        headers: {
          ...getHeaders(),
          "x-empresa-id": pId,
        },
        body: JSON.stringify({
          produto_id: selectedEstoque.produto_id,
          quantidade_real: toNumber(auditValue),
          observacao: "Auditoria física do estoque",
          justificativa: "Ajuste realizado pela tela de auditoria",
          estoque_minimo: toNumber(auditMinimoValue),
          data_validade: auditValidadeValue || null,
          lote: auditLoteValue || null,
          quantidade_caixas: parseInt(auditCaixasValue || "0", 10) || 0,
          unidades_por_caixa:
            parseInt(auditUnidadesPorCaixaValue || "1", 10) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao ajustar estoque");
        return;
      }

      setIsAuditDialogOpen(false);
      setSelectedEstoque(null);
      await fetchEstoques();
      alert("Ajuste registrado com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar auditoria:", error);
      alert("Erro de conexão ao ajustar estoque.");
    } finally {
      setSavingAudit(false);
    }
  };

  const handleEnviarParaLista = async () => {
    if (!selectedEstoque) return;

    const pId = getEmpresaId();

    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setSendingToLista(true);

    try {
      const atual = toNumber(auditValue);
      const minimo = toNumber(auditMinimoValue);
      const falta = minimo - atual;
      const quantidadeSolicitar = falta > 0 ? falta : 0;

      if (quantidadeSolicitar <= 0) {
        alert(
          "Esse item já está acima do mínimo. Ajuste o mínimo ou reduza o estoque para gerar compra."
        );
        return;
      }

      const res = await fetch("/api/lista-compras", {
        method: "POST",
        headers: {
          ...getHeaders(),
          "x-empresa-id": pId,
        },
        body: JSON.stringify({
          produto_id: selectedEstoque.produto_id,
          quantidade_solicitada: quantidadeSolicitar,
          unidade: getEstoqueUnidade(selectedEstoque),
          observacao: `Solicitado via auditoria. Estoque atual: ${auditValue} / mínimo: ${auditMinimoValue}`,
        }),
      });

      if (res.ok) {
        alert(`${getEstoqueNome(selectedEstoque)} enviado para compras!`);
        setIsAuditDialogOpen(false);
        setSelectedEstoque(null);
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Erro ao enviar para lista");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSendingToLista(false);
    }
  };

  const handleAddEstoque = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const pId = getEmpresaId();

    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setSavingAdd(true);

    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: {
          ...getHeaders(),
          "x-empresa-id": pId,
        },
        body: JSON.stringify({
          produto_id: addForm.produto_id,
          quantidade_atual: toNumber(addForm.quantidade_atual),
          estoque_minimo: toNumber(addForm.estoque_minimo),
          custo_unitario: toNumber(addForm.custo_unitario),
          data_validade: addForm.data_validade || null,
          lote: addForm.lote || null,
          quantidade_caixas: parseInt(addForm.quantidade_caixas || "0", 10) || 0,
          unidades_por_caixa:
            parseInt(addForm.unidades_por_caixa || "1", 10) || 1,
        }),
      });

      if (res.ok) {
        setIsAddDialogOpen(false);
        setAddForm({
          produto_id: "",
          quantidade_atual: "0",
          estoque_minimo: "0",
          custo_unitario: "0",
          data_validade: "",
          lote: "",
          quantidade_caixas: "0",
          unidades_por_caixa: "1",
        });
        await fetchEstoques();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Erro ao adicionar produto");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSavingAdd(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja apagar este item do estoque? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (res.ok) {
        await fetchEstoques();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Erro ao excluir item.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  const handleGerarListaAutomatica = async () => {
    const pId = getEmpresaId();

    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setGerandoListaAuto(true);

    try {
      const res = await fetch("/api/lista-compras/gerar-do-estoque", {
        method: "POST",
        headers: {
          ...getHeaders(),
          "x-empresa-id": pId,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao gerar lista automática");
        return;
      }

      alert(
        `Lista atualizada! Criados: ${data.criados ?? 0} | Atualizados: ${data.atualizados ?? 0}`
      );
    } catch {
      alert("Erro de conexão");
    } finally {
      setGerandoListaAuto(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    const current = toNumber(auditValue);
    const newValue = Math.max(0, current + delta);
    setAuditValue(String(newValue));
  };

  const filteredEstoques = useMemo(() => {
    return estoques.filter((e) => {
      const nome = getEstoqueNome(e);
      const categoria = getEstoqueCategoria(e);

      const matchesSearch =
        nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const abaixoMinimo =
        typeof e.abaixo_minimo === "boolean"
          ? e.abaixo_minimo
          : e.quantidade_atual <= e.estoque_minimo;

      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "baixo") return matchesSearch && abaixoMinimo;
      if (filterStatus === "ok") return matchesSearch && !abaixoMinimo;

      return matchesSearch;
    });
  }, [estoques, searchTerm, filterStatus]);

  const estoqueBaixoCount = useMemo(() => {
    return estoques.filter((e) =>
      typeof e.abaixo_minimo === "boolean"
        ? e.abaixo_minimo
        : e.quantidade_atual <= e.estoque_minimo
    ).length;
  }, [estoques]);

  const valorTotalEstoque = useMemo(() => {
    return estoques.reduce((acc, item) => {
      const custo =
        item.valor_estoque ??
        (item.quantidade_atual || 0) *
          (item.custo_unitario || item.custo_medio || 0);

      return acc + custo;
    }, 0);
  }, [estoques]);

  const estoqueSaudavelPercentual = useMemo(() => {
    if (!estoques.length) return 0;
    const saudaveis = estoques.length - estoqueBaixoCount;
    return Math.round((saudaveis / estoques.length) * 100);
  }, [estoques, estoqueBaixoCount]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] pb-12">
      <div className="relative z-10 mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all hover:text-orange-600"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="leading-none text-3xl font-black uppercase tracking-tighter text-gray-900">
                Estoque <span className="text-orange-600">Premium</span>
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Inventário, auditoria e compras
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={handleGerarListaAutomatica}
              variant="outline"
              className="w-full rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 sm:w-auto"
              disabled={gerandoListaAuto}
            >
              {gerandoListaAuto ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Gerar Lista Automática
            </Button>

            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="h-12 rounded-xl bg-gradient-to-r from-orange-600 to-pink-600 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105"
              disabled={produtos.length === 0}
            >
              <PackagePlus size={18} className="mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden rounded-[25px] border-none bg-gradient-to-br from-gray-900 to-gray-800 p-5 text-white shadow-xl md:col-span-2">
            <DollarSign className="absolute right-0 top-0 h-24 w-24 p-4 opacity-10" />
            <CardContent className="p-0">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-green-400">
                Capital Investido no Estoque
              </p>
              <p className="text-4xl font-black">{formatCurrency(valorTotalEstoque)}</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-center rounded-[25px] border bg-white p-5 text-gray-900 shadow-sm">
            <CardContent className="p-0">
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                Total de SKUs
              </p>
              <p className="text-3xl font-black">
                {estoques.length}{" "}
                <span className="text-sm text-gray-400">itens</span>
              </p>
            </CardContent>
          </Card>

          <Card
            className={`flex flex-col justify-center rounded-[25px] border p-5 transition-all ${
              estoqueBaixoCount > 0
                ? "border-red-200 bg-red-50 text-red-600 shadow-md shadow-red-100"
                : "border-green-100 bg-green-50 text-green-600 shadow-sm"
            }`}
          >
            <CardContent className="p-0">
              <p className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest">
                {estoqueBaixoCount > 0 ? (
                  <ShieldAlert size={12} />
                ) : (
                  <Archive size={12} />
                )}
                {estoqueBaixoCount > 0 ? "Itens em Alerta" : "Estoque Saudável"}
              </p>
              <p className="text-3xl font-black">
                {estoqueBaixoCount > 0 ? estoqueBaixoCount : `${estoqueSaudavelPercentual}%`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm md:flex-nowrap">
          <div className="flex min-w-[200px] flex-1 items-center rounded-xl bg-gray-50 px-4">
            <Search className="text-gray-400" size={18} />
            <Input
              className="h-12 border-0 bg-transparent text-sm font-bold focus-visible:ring-0"
              placeholder="Procurar produto no estoque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-12 w-full rounded-xl border-0 bg-gray-50 text-xs font-black uppercase focus:ring-0 md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos os Itens</SelectItem>
              <SelectItem value="baixo">Abaixo do Mínimo</SelectItem>
              <SelectItem value="ok">Quantidade OK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3">
          {filteredEstoques.map((item) => {
            const isBaixo =
              typeof item.abaixo_minimo === "boolean"
                ? item.abaixo_minimo
                : item.quantidade_atual <= item.estoque_minimo;

            const valorTotalItem =
              item.valor_estoque ??
              (item.quantidade_atual || 0) *
                (item.custo_unitario || item.custo_medio || 0);

            return (
              <div
                key={item.id}
                className={`group flex flex-col justify-between rounded-2xl border-2 bg-white p-4 transition-all md:flex-row md:items-center ${
                  isBaixo
                    ? "border-red-100"
                    : "border-transparent shadow-sm hover:border-orange-100"
                }`}
              >
                <div className="mb-4 flex items-center gap-4 md:mb-0 md:w-1/3">
                  <div
                    className={`rounded-xl p-3 transition-colors ${
                      isBaixo
                        ? "bg-red-50 text-red-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    <Package size={24} />
                  </div>

                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
                      {getEstoqueNome(item)}
                    </h3>
                    <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">
                      {getEstoqueCategoria(item)}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between border-x border-gray-50 px-4 md:mb-0 md:w-1/3">
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase text-gray-400">
                      Custo Médio
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {formatCurrency(item.custo_unitario || item.custo_medio || 0)}{" "}
                      <span className="text-[10px] font-normal text-gray-400">
                        / {getEstoqueUnidade(item)}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="mb-1 text-[9px] font-black uppercase text-gray-400">
                      Total em Estoque
                    </p>
                    <p className="text-sm font-black text-green-600">
                      {formatCurrency(valorTotalItem)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 md:w-1/3 md:justify-end">
                  <div className="text-right">
                    <p className="mb-1 text-[9px] font-black uppercase text-gray-400">
                      Prateleira
                    </p>
                    <div className="flex items-baseline justify-end gap-1">
                      <p
                        className={`text-2xl font-black leading-none ${
                          isBaixo ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {item.quantidade_atual}
                      </p>
                      <span className="text-xs font-bold text-gray-500">
                        {getEstoqueUnidade(item)}
                      </span>
                    </div>

                    <div className="mt-1">
                      {isBaixo ? (
                        <Badge className="rounded-full border-0 bg-red-500 px-2 py-0.5 text-[8px] font-black uppercase text-white">
                          Comprar!
                        </Badge>
                      ) : (
                        <Badge className="rounded-full border-0 bg-green-500 px-2 py-0.5 text-[8px] font-black uppercase text-white">
                          OK
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleOpenAudit(item)}
                      className="h-12 rounded-xl bg-orange-50 text-xs font-bold text-orange-600 shadow-sm transition-all hover:bg-orange-600 hover:text-white"
                    >
                      <ClipboardList size={16} className="mr-2" />
                      Auditar
                    </Button>

                    <Button
                      onClick={() => handleDeleteItem(item.id)}
                      variant="ghost"
                      className="h-12 w-12 rounded-xl p-0 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredEstoques.length === 0 && !isLoading && (
            <div className="rounded-3xl border-2 border-dashed border-gray-100 bg-white py-16 text-center shadow-sm">
              <Boxes size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-black uppercase tracking-widest text-gray-500">
                Estoque vazio
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Dê entrada nos seus produtos para calcular o patrimônio.
              </p>
            </div>
          )}
        </div>

        <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
          <DialogContent
            aria-describedby={undefined}
            className="max-w-lg rounded-[35px] border-none bg-white p-8 shadow-2xl"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase text-gray-900">
                <ClipboardList className="text-orange-600" />
                Auditoria de <span className="text-orange-600">Estoque</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Ajuste físico e atualização operacional
              </DialogDescription>
            </DialogHeader>

            {selectedEstoque && (
              <div className="mt-2 space-y-6">
                <div className="flex items-center justify-between rounded-2xl bg-gray-900 p-5 text-white shadow-lg">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Produto
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {getEstoqueNome(selectedEstoque)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Sistema (Atual)
                    </p>
                    <p className="text-2xl font-black text-orange-400">
                      {selectedEstoque.quantidade_atual}{" "}
                      <span className="text-sm text-gray-500">
                        {getEstoqueUnidade(selectedEstoque)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="ml-1 text-[10px] font-black uppercase text-gray-500">
                    Contagem Física Real
                  </Label>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => adjustQuantity(-1)}
                      className="h-12 w-12 rounded-xl border-0 bg-gray-50 hover:bg-gray-200"
                    >
                      <Minus size={16} />
                    </Button>

                    <Input
                      type="number"
                      step="0.01"
                      value={auditValue}
                      onChange={(e) => setAuditValue(e.target.value)}
                      className="h-12 rounded-xl border-0 bg-gray-50 text-center text-lg font-black focus-visible:ring-1 focus-visible:ring-orange-500"
                    />

                    <Button
                      variant="outline"
                      onClick={() => adjustQuantity(1)}
                      className="h-12 w-12 rounded-xl border-0 bg-gray-50 hover:bg-gray-200"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase text-gray-500">
                      Estoque Mínimo
                    </Label>
                    <Input
                      type="number"
                      value={auditMinimoValue}
                      onChange={(e) => setAuditMinimoValue(e.target.value)}
                      className="h-12 rounded-xl border-0 bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase text-gray-500">
                      Validade
                    </Label>
                    <Input
                      type="date"
                      value={auditValidadeValue}
                      onChange={(e) => setAuditValidadeValue(e.target.value)}
                      className="h-12 rounded-xl border-0 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase text-gray-500">
                      Lote
                    </Label>
                    <Input
                      value={auditLoteValue}
                      onChange={(e) => setAuditLoteValue(e.target.value)}
                      className="h-12 rounded-xl border-0 bg-gray-50"
                      placeholder="Ex: LOTE-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase text-gray-500">
                      Caixas
                    </Label>
                    <Input
                      type="number"
                      value={auditCaixasValue}
                      onChange={(e) => setAuditCaixasValue(e.target.value)}
                      className="h-12 rounded-xl border-0 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="ml-1 text-[10px] font-black uppercase text-gray-500">
                    Unidades por Caixa
                  </Label>
                  <Input
                    type="number"
                    value={auditUnidadesPorCaixaValue}
                    onChange={(e) =>
                      setAuditUnidadesPorCaixaValue(e.target.value)
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSaveAudit}
                    disabled={savingAudit}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:scale-[1.02]"
                  >
                    {savingAudit ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Ajuste
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleEnviarParaLista}
                    disabled={sendingToLista}
                    className="h-12 w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    {sendingToLista ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    Enviar para Compras
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent
            aria-describedby={undefined}
            className="max-w-md rounded-[35px] border-none bg-white p-8 shadow-2xl"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase">
                Entrada de <span className="text-orange-600">Estoque</span>
              </DialogTitle>
              <DialogDescription className="hidden">
                Adicionar novo item ao estoque.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddEstoque} className="mt-2 space-y-5">
              <div className="space-y-1.5">
                <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                  Produto
                </Label>

                <Select
                  value={addForm.produto_id}
                  onValueChange={(v) => setAddForm({ ...addForm, produto_id: v })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-0 bg-gray-50 text-xs font-bold focus:ring-0">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {produtos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {getProdutoNome(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                    Qtd Entrada
                  </Label>
                  <Input
                    type="number"
                    value={addForm.quantidade_atual}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        quantidade_atual: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50 text-center text-sm font-black"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                    Mínimo
                  </Label>
                  <Input
                    type="number"
                    value={addForm.estoque_minimo}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        estoque_minimo: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50 text-center text-sm font-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="ml-1 text-[9px] font-black uppercase text-green-600">
                  Custo Unitário
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={addForm.custo_unitario}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      custo_unitario: e.target.value,
                    })
                  }
                  className="h-12 rounded-xl border-green-100 bg-green-50/50"
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                    Validade
                  </Label>
                  <Input
                    type="date"
                    value={addForm.data_validade}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        data_validade: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50"
                  />
                </div>

                <div>
                  <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                    Lote
                  </Label>
                  <Input
                    value={addForm.lote}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        lote: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50"
                    placeholder="Ex: LOTE-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                    Caixas
                  </Label>
                  <Input
                    type="number"
                    value={addForm.quantidade_caixas}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        quantidade_caixas: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50"
                  />
                </div>

                <div>
                  <Label className="ml-1 text-[9px] font-black uppercase text-gray-500">
                    Unid/Caixa
                  </Label>
                  <Input
                    type="number"
                    value={addForm.unidades_por_caixa}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        unidades_por_caixa: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-0 bg-gray-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-14 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-transform hover:scale-[1.02]"
                disabled={!addForm.produto_id || savingAdd}
              >
                {savingAdd ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PackagePlus size={18} className="mr-2" />
                )}
                Gravar no Estoque
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
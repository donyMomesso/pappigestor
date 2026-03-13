"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Loader2,
  Search,
  Import,
  Barcode,
  X,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Check,
  Merge,
  GitMerge,
  Database,
  BrainCircuit,
} from "lucide-react";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  PRODUTOS_FOOD_SERVICE,
  CATEGORIAS_FOOD_SERVICE,
  ProdutoFoodService,
  buscarProdutoFoodService,
  buscarSugestoesFoodService,
  normalizarTexto,
} from "@/data/produtos-food-service";

interface Produto {
  id: number;
  nome_produto: string;
  categoria_produto: string;
  unidade_medida: string;
  ultimo_preco_pago: number | null;
  fornecedor_preferencial_id: number | null;
  fornecedor_nome?: string;
  codigo_barras?: string;
  marca?: string;
  descricao?: string;
  peso_embalagem?: string;
  preco_referencia?: number;
  created_at: string;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
}

type ProdutoFoodServiceCompat = ProdutoFoodService & {
  embalagem?: string;
  pesoAprox?: string | number;
  peso_aprox?: string | number;
  peso?: string | number;
  unidadeMedida?: string;
  unidade_medida?: string;
  unidade?: string;
};

interface DuplicadoGrupo {
  nome_normalizado: string;
  produtos: Array<{
    id: number;
    nome_produto: string;
    categoria_produto: string;
    unidade_medida: string;
    marca?: string;
    peso_embalagem?: string;
  }>;
}

const CATEGORIAS = Array.from(
  new Set([
    ...CATEGORIAS_FOOD_SERVICE,
    "Insumos",
    "Embalagens",
    "Mercado",
    "Outros",
  ])
);

const UNIDADES = [
  "Kg",
  "g",
  "Litro",
  "ml",
  "Unidade",
  "Fardo",
  "Caixa",
  "Pacote",
  "Saco",
  "Galão",
  "Bandeja",
  "Pct",
];

function getEmpresaId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pId") || localStorage.getItem("empresaId") || "";
}

const getHeaders = (withJson = false): HeadersInit => {
  const pId = getEmpresaId();
  return {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
    ...(pId ? { "x-pizzaria-id": pId } : {}),
  };
};

const getImportUnidade = (item: ProdutoFoodServiceCompat) =>
  String(item.unidadeMedida ?? item.unidade_medida ?? item.unidade ?? "kg").toLowerCase();

const getImportEmbalagem = (item: ProdutoFoodServiceCompat) => {
  const valor = item.embalagem ?? item.pesoAprox ?? item.peso_aprox ?? item.peso ?? null;
  return valor == null || valor === "" ? null : String(valor);
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [importSearch, setImportSearch] = useState("");
  const [importCategoria, setImportCategoria] = useState<string>("all");
  const [selectedImportItems, setSelectedImportItems] = useState<ProdutoFoodService[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportTextDialogOpen, setIsImportTextDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImportingText, setIsImportingText] = useState(false);
  const [importTextResults, setImportTextResults] = useState<
    Array<{ produto: string; added: boolean; exists?: boolean }>
  >([]);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [duplicados, setDuplicados] = useState<DuplicadoGrupo[]>([]);
  const [isDuplicadosDialogOpen, setIsDuplicadosDialogOpen] = useState(false);
  const [isLoadingDuplicados, setIsLoadingDuplicados] = useState(false);
  const [unificando, setUnificando] = useState<number | null>(null);
  const [catalogoBaseSelecionado, setCatalogoBaseSelecionado] =
    useState<ProdutoFoodServiceCompat | null>(null);

  const [form, setForm] = useState({
    nome_produto: "",
    categoria_produto: "",
    unidade_medida: "",
    fornecedor_preferencial_id: "",
    codigo_barras: "",
    marca: "",
    descricao: "",
    peso_embalagem: "",
    preco_referencia: "",
  });

  const fetchProdutos = async () => {
    const pId = getEmpresaId();
    if (!pId) {
      console.error("Empresa não encontrada no localStorage para buscar produtos.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/produtos", {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Erro ao carregar produtos:", data);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFornecedores = async () => {
    const pId = getEmpresaId();
    if (!pId) {
      console.error("Empresa não encontrada no localStorage para buscar fornecedores.");
      return;
    }

    try {
      const res = await fetch("/api/fornecedores", {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setFornecedores(
          data.filter((f: Fornecedor & { is_ativo: number }) => f.is_ativo)
        );
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Erro ao carregar fornecedores:", data);
      }
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    }
  };

  const fetchDuplicados = async () => {
    const pId = getEmpresaId();
    if (!pId) {
      console.error("Empresa não encontrada no localStorage para buscar duplicados.");
      setIsLoadingDuplicados(false);
      return;
    }

    setIsLoadingDuplicados(true);

    try {
      const res = await fetch("/api/produtos/duplicados", {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setDuplicados(data);
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Erro ao buscar duplicados:", data);
      }
    } catch (err) {
      console.error("Erro ao buscar duplicados:", err);
    } finally {
      setIsLoadingDuplicados(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
    fetchFornecedores();
    fetchDuplicados();
  }, []);

  const resetForm = () => {
    setCatalogoBaseSelecionado(null);
    setForm({
      nome_produto: "",
      categoria_produto: "",
      unidade_medida: "",
      fornecedor_preferencial_id: "",
      codigo_barras: "",
      marca: "",
      descricao: "",
      peso_embalagem: "",
      preco_referencia: "",
    });
  };

  const sugestoesCatalogo = useMemo(() => {
    if (!form.nome_produto.trim() || editingProduto) return [];
    return buscarSugestoesFoodService(form.nome_produto, 6) as ProdutoFoodServiceCompat[];
  }, [form.nome_produto, editingProduto]);

  const produtosParecidosEmpresa = useMemo(() => {
    const termo = normalizarTexto(form.nome_produto);
    if (!termo || editingProduto) return [];

    return produtos
      .filter((produto) => {
        const nome = normalizarTexto(produto.nome_produto);
        return nome.includes(termo) || termo.includes(nome);
      })
      .slice(0, 4);
  }, [form.nome_produto, produtos, editingProduto]);

  const aplicarCatalogoNoFormulario = (item: ProdutoFoodServiceCompat) => {
    setCatalogoBaseSelecionado(item);
    setForm((prev) => ({
      ...prev,
      nome_produto: item.nome,
      categoria_produto: item.categoria || prev.categoria_produto,
      unidade_medida: getImportUnidade(item),
      peso_embalagem: getImportEmbalagem(item) || prev.peso_embalagem,
      descricao: item.descricao || prev.descricao,
    }));
  };

  const limparLinhaImportacao = (linha: string) => {
    return linha
      .replace(/[-–—]/g, " ")
      .replace(/\b\d+[\.,]?\d*\s*(kg|g|gr|l|ml|lt|un|und|cx|caixa|pct|pacote|fardo)\b/gi, " ")
      .replace(/\b\d+[\.,]?\d*\b/g, " ")
      .replace(/[;,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const capitalizarNomeLivre = (texto: string) =>
    texto
      .split(" ")
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
      .join(" ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    const payload = {
      ...form,
      fornecedor_preferencial_id:
        form.fornecedor_preferencial_id && form.fornecedor_preferencial_id !== "none"
          ? parseInt(form.fornecedor_preferencial_id)
          : null,
      preco_referencia: form.preco_referencia ? parseFloat(form.preco_referencia) : null,
    };

    try {
      const url = editingProduto ? `/api/produtos/${editingProduto.id}` : "/api/produtos";
      const method = editingProduto ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingProduto(null);
        resetForm();
        fetchProdutos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar produto");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setCatalogoBaseSelecionado(null);
    setForm({
      nome_produto: produto.nome_produto,
      categoria_produto: produto.categoria_produto || "",
      unidade_medida: produto.unidade_medida || "",
      fornecedor_preferencial_id: produto.fornecedor_preferencial_id
        ? String(produto.fornecedor_preferencial_id)
        : "",
      codigo_barras: produto.codigo_barras || "",
      marca: produto.marca || "",
      descricao: produto.descricao || "",
      peso_embalagem: produto.peso_embalagem || "",
      preco_referencia: produto.preco_referencia ? String(produto.preco_referencia) : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (res.ok) {
        fetchProdutos();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao excluir produto");
      }
    } catch (err) {
      alert("Erro ao excluir produto");
    }
  };

  const openNewDialog = () => {
    setEditingProduto(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const startInlineEdit = (id: number, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue || "");
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    const payload: Record<string, string> = {};
    payload[editingCell.field] = editingValue;

    try {
      const res = await fetch(`/api/produtos/${editingCell.id}`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchProdutos();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao salvar alteração");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      cancelInlineEdit();
    }
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === "Escape") {
      cancelInlineEdit();
    }
  };

  const handleOpenDuplicados = async () => {
    setIsDuplicadosDialogOpen(true);
    await fetchDuplicados();
  };

  const handleUnificar = async (principalId: number, duplicadoId: number) => {
    if (
      !confirm(
        "Unificar estes produtos? Todas as referências serão atualizadas para o produto principal."
      )
    ) {
      return;
    }

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setUnificando(duplicadoId);

    try {
      const res = await fetch("/api/produtos/unificar", {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          produto_principal_id: principalId,
          produto_duplicado_id: duplicadoId,
        }),
      });

      if (res.ok) {
        await fetchDuplicados();
        await fetchProdutos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao unificar");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setUnificando(null);
    }
  };

  const handleUnificarTodos = async (grupo: DuplicadoGrupo) => {
    if (
      !confirm(
        `Unificar todos os ${grupo.produtos.length} produtos "${grupo.nome_normalizado}" no primeiro item?`
      )
    ) {
      return;
    }

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    const principalId = grupo.produtos[0].id;
    setUnificando(principalId);

    try {
      for (let i = 1; i < grupo.produtos.length; i++) {
        await fetch("/api/produtos/unificar", {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify({
            produto_principal_id: principalId,
            produto_duplicado_id: grupo.produtos[i].id,
          }),
        });
      }

      await fetchDuplicados();
      await fetchProdutos();
    } catch (err) {
      alert("Erro ao unificar");
    } finally {
      setUnificando(null);
    }
  };

  const filteredProdutos = produtos.filter((p) => {
    const matchesSearch =
      p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.codigo_barras && p.codigo_barras.includes(searchTerm));

    const matchesCategoria =
      filterCategoria === "all" || p.categoria_produto === filterCategoria;

    return matchesSearch && matchesCategoria;
  });

  const filteredImportProdutos = PRODUTOS_FOOD_SERVICE.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(importSearch.toLowerCase());
    const matchesCategoria = importCategoria === "all" || p.categoria === importCategoria;
    return matchesSearch && matchesCategoria;
  });

  const toggleImportItem = (item: ProdutoFoodService) => {
    setSelectedImportItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleImportSelected = async () => {
    if (selectedImportItems.length === 0) return;

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setIsImporting(true);

    try {
      for (const rawItem of selectedImportItems) {
        const item = rawItem as ProdutoFoodServiceCompat;

        await fetch("/api/produtos", {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify({
            nome_produto: item.nome,
            categoria_produto: item.categoria,
            unidade_medida: getImportUnidade(item),
            peso_embalagem: getImportEmbalagem(item),
          }),
        });
      }

      setIsImportDialogOpen(false);
      setSelectedImportItems([]);
      setImportSearch("");
      fetchProdutos();
    } catch (err) {
      alert("Erro ao importar produtos");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportText = async () => {
    if (!importText.trim()) return;

    const pId = getEmpresaId();
    if (!pId) {
      alert("Empresa não encontrada no navegador.");
      return;
    }

    setIsImportingText(true);
    setImportTextResults([]);

    try {
      const linhas = importText
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter(Boolean);

      const results: typeof importTextResults = [];

      for (const linha of linhas) {
        const textoLimpo = limparLinhaImportacao(linha);
        const produtoBase = buscarProdutoFoodService(textoLimpo || linha) as ProdutoFoodServiceCompat | null;

        const nomeCanonico = produtoBase?.nome || capitalizarNomeLivre(textoLimpo || linha);
        const produtoExistente = produtos.find(
          (p) => normalizarTexto(p.nome_produto) === normalizarTexto(nomeCanonico)
        );

        if (produtoExistente) {
          results.push({
            produto: nomeCanonico,
            added: false,
            exists: true,
          });
          continue;
        }

        const addRes = await fetch("/api/produtos", {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify({
            nome_produto: nomeCanonico,
            unidade_medida: produtoBase ? getImportUnidade(produtoBase) : "kg",
            categoria_produto: produtoBase?.categoria || "Insumos",
            peso_embalagem: produtoBase ? getImportEmbalagem(produtoBase) : null,
            descricao: produtoBase?.descricao || "Importado automaticamente da lista de compras.",
          }),
        });

        results.push({
          produto: nomeCanonico,
          added: addRes.ok,
        });
      }

      setImportTextResults(results);
      await fetchProdutos();
    } catch (err) {
      console.error("Erro ao importar:", err);
      alert("Erro de conexão");
    } finally {
      setIsImportingText(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="dark:text-white">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meus Produtos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cadastro oficial da empresa para estoque, compras, CMV e precificação.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" className="dark:border-gray-600 dark:text-gray-200">
            <Link href="/app/catalogo-global">
              <Database className="w-4 h-4 mr-2" />
              Catálogo Global
            </Link>
          </Button>
          <Button asChild variant="outline" className="dark:border-gray-600 dark:text-gray-200">
            <Link href="/app/produtos-master">
              <BrainCircuit className="w-4 h-4 mr-2" />
              Inteligência
            </Link>
          </Button>

          {duplicados.length > 0 && (
            <Button
              onClick={handleOpenDuplicados}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <GitMerge className="w-4 h-4 mr-2" />
              {duplicados.length} Duplicados
            </Button>
          )}

          <Button
            onClick={handleOpenDuplicados}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            <Merge className="w-4 h-4 mr-2" />
            Unificar Duplicados
          </Button>

          <Button
            onClick={() => setIsImportTextDialogOpen(true)}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Importar Lista
          </Button>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Import className="w-4 h-4 mr-2" />
                Importar Food Service
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[80vh] dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  Importar do Catálogo Food Service
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={importSearch}
                      onChange={(e) => setImportSearch(e.target.value)}
                      placeholder="Buscar produto..."
                      className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <Select value={importCategoria} onValueChange={setImportCategoria}>
                    <SelectTrigger className="w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="all">Todas</SelectItem>
                      {CATEGORIAS_FOOD_SERVICE.map((cat, index) => (
                        <SelectItem key={`${cat}-${index}`} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedImportItems.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      {selectedImportItems.length} produto(s) selecionado(s)
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedImportItems([])}
                      className="h-6 px-2 text-orange-700 dark:text-orange-300"
                    >
                      <X className="w-3 h-3 mr-1" /> Limpar
                    </Button>
                  </div>
                )}

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredImportProdutos.map((rawItem) => {
                    const item = rawItem as ProdutoFoodServiceCompat;
                    const isSelected = selectedImportItems.find((i) => i.id === item.id);
                    const embalagemLabel = getImportEmbalagem(item);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleImportItem(item)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 dark:border-orange-400"
                            : "border-gray-200 hover:border-orange-300 dark:border-gray-600 dark:hover:border-orange-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.nome}</p>

                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {item.categoria}
                              </span>

                              {embalagemLabel && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {embalagemLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-orange-500 bg-orange-500"
                                : "border-gray-300 dark:border-gray-500"
                            }`}
                          >
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                    className="flex-1 dark:border-gray-600 dark:text-gray-200"
                  >
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleImportSelected}
                    disabled={selectedImportItems.length === 0 || isImporting}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Importar {selectedImportItems.length > 0 && `(${selectedImportItems.length})`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  {editingProduto ? "Editar Produto" : "Novo Produto"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome do Produto *
                    </label>
                    <Input
                      value={form.nome_produto}
                      onChange={(e) => {
                        setCatalogoBaseSelecionado(null);
                        setForm({ ...form, nome_produto: e.target.value });
                      }}
                      placeholder="Ex: Mussarela, Sal refinado, Molho de tomate"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />

                    {!!catalogoBaseSelecionado && (
                      <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300">
                        Base padronizada vinculada: <strong>{catalogoBaseSelecionado.nome}</strong> · {catalogoBaseSelecionado.categoria}
                      </div>
                    )}

                    {!editingProduto && (sugestoesCatalogo.length > 0 || produtosParecidosEmpresa.length > 0) && (
                      <div className="mt-2 space-y-2 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
                        {sugestoesCatalogo.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Sugestões do catálogo inteligente
                            </p>
                            <div className="space-y-1">
                              {sugestoesCatalogo.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => aplicarCatalogoNoFormulario(item)}
                                  className="flex w-full items-start justify-between rounded-lg border border-transparent px-3 py-2 text-left hover:border-orange-200 hover:bg-orange-50 dark:hover:border-orange-900/40 dark:hover:bg-orange-900/20"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.nome}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.categoria} · {item.unidadeMedida || "kg"}
                                      {item.embalagem ? ` · ${item.embalagem}` : ""}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                    Usar base
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {produtosParecidosEmpresa.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Já existem nos meus produtos
                            </p>
                            <div className="space-y-1">
                              {produtosParecidosEmpresa.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleEdit(item)}
                                  className="flex w-full items-start justify-between rounded-lg border border-transparent px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-900/40 dark:hover:bg-blue-900/20"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.nome_produto}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.categoria_produto || "Sem categoria"}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    Abrir cadastro
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marca
                    </label>
                    <Input
                      value={form.marca}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      placeholder="Ex: Sadia"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código de Barras
                    </label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={form.codigo_barras}
                        onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
                        placeholder="EAN/GTIN"
                        className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria
                    </label>
                    <Select
                      value={form.categoria_produto}
                      onValueChange={(v) => setForm({ ...form, categoria_produto: v })}
                    >
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {CATEGORIAS.map((cat, index) => (
                          <SelectItem key={`${cat}-${index}`} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unidade de Medida
                    </label>
                    <Select
                      value={form.unidade_medida}
                      onValueChange={(v) => setForm({ ...form, unidade_medida: v })}
                    >
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {UNIDADES.map((un) => (
                          <SelectItem key={un} value={un}>
                            {un}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Peso / Embalagem
                    </label>
                    <Input
                      value={form.peso_embalagem}
                      onChange={(e) => setForm({ ...form, peso_embalagem: e.target.value })}
                      placeholder="Ex: 2,5kg, Cx 12un"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preço Referência (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.preco_referencia}
                      onChange={(e) => setForm({ ...form, preco_referencia: e.target.value })}
                      placeholder="0,00"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fornecedor Preferencial
                    </label>
                    <Select
                      value={form.fornecedor_preferencial_id}
                      onValueChange={(v) => setForm({ ...form, fornecedor_preferencial_id: v })}
                    >
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="none">Nenhum</SelectItem>
                        {fornecedores.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.nome_fantasia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição / Observações
                    </label>
                    <Input
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      placeholder="Informações adicionais do produto"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 dark:border-gray-600 dark:text-gray-200"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                    {editingProduto ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Produtos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{produtos.length}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Categorias</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(produtos.map((p) => p.categoria_produto).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Com Preço</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {produtos.filter((p) => p.ultimo_preco_pago || p.preco_referencia).length}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Com Fornecedor</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {produtos.filter((p) => p.fornecedor_nome || p.fornecedor_preferencial_id).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto, marca ou código..."
            className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIAS.map((cat, index) => (
              <SelectItem key={`${cat}-${index}`} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProdutos.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterCategoria !== "all"
                ? "Nenhum produto encontrado"
                : "Nenhum produto cadastrado"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Use o Catálogo Global, importe uma lista ou cadastre manualmente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Produto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:table-cell">Unidade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:table-cell">Embalagem</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Último Preço</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProdutos.map((produto) => {
                const isEditingNome = editingCell?.id === produto.id && editingCell?.field === "nome_produto";
                const isEditingCategoria = editingCell?.id === produto.id && editingCell?.field === "categoria_produto";
                const isEditingUnidade = editingCell?.id === produto.id && editingCell?.field === "unidade_medida";
                const isEditingEmbalagem = editingCell?.id === produto.id && editingCell?.field === "peso_embalagem";

                return (
                  <tr key={produto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {isEditingNome ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            autoFocus
                            className="h-7 text-sm dark:bg-gray-700 dark:border-gray-600"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveInlineEdit}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelInlineEdit}>
                            <X className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded px-1 -mx-1"
                          onClick={() => startInlineEdit(produto.id, "nome_produto", produto.nome_produto)}
                          title="Clique para editar"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{produto.nome_produto}</span>
                          {produto.marca && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({produto.marca})</span>
                          )}
                          {produto.codigo_barras && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3 h-3" /> {produto.codigo_barras}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      {isEditingCategoria ? (
                        <div className="flex items-center gap-1">
                          <Select value={editingValue} onValueChange={(v) => setEditingValue(v)}>
                            <SelectTrigger className="h-7 text-xs w-32 dark:bg-gray-700 dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              {CATEGORIAS.map((cat, index) => (
                                <SelectItem key={`${cat}-${index}`} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveInlineEdit}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelInlineEdit}>
                            <X className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded px-1 -mx-1 inline-block"
                          onClick={() => startInlineEdit(produto.id, "categoria_produto", produto.categoria_produto || "")}
                          title="Clique para editar"
                        >
                          {produto.categoria_produto ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              {produto.categoria_produto}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">+ categoria</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isEditingUnidade ? (
                        <div className="flex items-center gap-1">
                          <Select value={editingValue} onValueChange={(v) => setEditingValue(v)}>
                            <SelectTrigger className="h-7 text-xs w-24 dark:bg-gray-700 dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              {UNIDADES.map((un) => (
                                <SelectItem key={un} value={un}>{un}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveInlineEdit}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelInlineEdit}>
                            <X className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded px-1 -mx-1 inline-block text-gray-600 dark:text-gray-400"
                          onClick={() => startInlineEdit(produto.id, "unidade_medida", produto.unidade_medida || "")}
                          title="Clique para editar"
                        >
                          {produto.unidade_medida || <span className="text-xs text-gray-400">+ unidade</span>}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isEditingEmbalagem ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            autoFocus
                            placeholder="Ex: 2,5kg"
                            className="h-7 text-sm w-24 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveInlineEdit}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelInlineEdit}>
                            <X className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded px-1 -mx-1 inline-block text-gray-600 dark:text-gray-400"
                          onClick={() => startInlineEdit(produto.id, "peso_embalagem", produto.peso_embalagem || "")}
                          title="Clique para editar"
                        >
                          {produto.peso_embalagem || <span className="text-xs text-gray-400">+ embalagem</span>}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={produto.ultimo_preco_pago || produto.preco_referencia ? "font-medium text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}>
                        {formatCurrency(produto.ultimo_preco_pago ?? produto.preco_referencia)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)}>
                        <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(produto.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={isImportTextDialogOpen}
        onOpenChange={(open) => {
          setIsImportTextDialogOpen(open);
          if (!open) {
            setImportText("");
            setImportTextResults([]);
          }
        }}
      >
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Importar Lista de Produtos
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cole uma lista de produtos recebida por WhatsApp ou digite os nomes. A IA vai cadastrar automaticamente.
            </p>

            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Exemplos:\nMussarela\nCalabresa\nFarinha de trigo\nQueijo prato\nPresunto\n\nOu com quantidades:\nFubá 2kg\nOvo - caixa`}
              className="min-h-[150px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            {importTextResults.length > 0 && (
              <div className="border rounded-lg p-3 max-h-48 overflow-auto dark:border-gray-600">
                <p className="text-sm font-medium mb-2 dark:text-white">Resultado da importação:</p>
                <div className="space-y-1">
                  {importTextResults.map((r, idx) => (
                    <div
                      key={idx}
                      className={`text-sm flex items-center gap-2 ${
                        r.added
                          ? "text-green-600 dark:text-green-400"
                          : r.exists
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {r.added ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : r.exists ? (
                        <Package className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{r.produto}</span>
                      {r.exists && <span className="text-xs">(já cadastrado)</span>}
                      {!r.added && !r.exists && <span className="text-xs">(erro ao cadastrar)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsImportTextDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              {importTextResults.length > 0 ? "Fechar" : "Cancelar"}
            </Button>

            {importTextResults.length === 0 && (
              <Button
                onClick={handleImportText}
                disabled={!importText.trim() || isImportingText}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isImportingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Cadastrar Produtos
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDuplicadosDialogOpen} onOpenChange={setIsDuplicadosDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <GitMerge className="w-5 h-5" />
              Produtos Duplicados
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {isLoadingDuplicados ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : duplicados.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Nenhum produto duplicado encontrado!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {duplicados.map((grupo, gIdx) => (
                  <div key={gIdx} className="border rounded-lg p-3 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-orange-700 dark:text-orange-400">
                        "{grupo.nome_normalizado}" ({grupo.produtos.length} duplicados)
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnificarTodos(grupo)}
                        disabled={unificando !== null}
                        className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-600 dark:hover:bg-purple-900/20"
                      >
                        {unificando === grupo.produtos[0].id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Merge className="w-4 h-4 mr-1" />
                            Unificar Todos
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {grupo.produtos.map((p, pIdx) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            pIdx === 0
                              ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700"
                              : "bg-gray-50 dark:bg-gray-700"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium dark:text-white">{p.nome_produto}</span>
                              {pIdx === 0 && (
                                <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded">PRINCIPAL</span>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {p.categoria_produto} • {p.unidade_medida}
                              {p.marca && ` • ${p.marca}`}
                              {p.peso_embalagem && ` • ${p.peso_embalagem}`}
                            </div>
                          </div>

                          {pIdx > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnificar(grupo.produtos[0].id, p.id)}
                              disabled={unificando !== null}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              {unificando === p.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Mesclar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDuplicadosDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
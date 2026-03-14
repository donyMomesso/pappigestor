"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/react-app/components/ui/dialog";
import { Textarea } from "@/react-app/components/ui/textarea";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { CATEGORIAS } from "@/shared/types";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  ClipboardPaste,
  Upload,
  Camera,
  FileText,
  Loader2,
  Check,
  X,
  Trash2,
  Pencil,
  Package,
  Wand2,
  ShoppingCart,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Bot,
} from "lucide-react";

const LOGO_URL =
  "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd"] as const;

type CategoriaOption = {
  value: string;
  label: string;
};

interface ItemCompra {
  id: string;
  produto: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
  origem?: "manual" | "estoque" | "ia" | "texto";
  observacao?: string;
}

interface Fornecedor {
  id: string | number;
  nome_fantasia?: string;
  razao_social?: string;
}

interface ItemListaEstoque {
  id?: string | number;
  produto?: string;
  nome?: string;
  nome_produto?: string;
  quantidade?: number | string;
  quantidade_sugerida?: number | string;
  qtd?: number | string;
  unidade?: string;
  unidade_medida?: string;
  categoria?: string;
  observacao?: string;
}

function normalizarCategorias(input: unknown): CategoriaOption[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item): CategoriaOption | null => {
      if (typeof item === "string") {
        return { value: item, label: item };
      }

      if (
        item &&
        typeof item === "object" &&
        "value" in item &&
        "label" in item &&
        typeof (item as { value?: unknown }).value === "string" &&
        typeof (item as { label?: unknown }).label === "string"
      ) {
        return {
          value: (item as { value: string }).value,
          label: (item as { label: string }).label,
        };
      }

      return null;
    })
    .filter((item): item is CategoriaOption => item !== null);
}

export default function CompradorPage() {
  const { localUser } = useAppAuth();

  const categoriasOptions = useMemo(
    () => normalizarCategorias(CATEGORIAS),
    []
  );

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSugestaoEstoque, setLoadingSugestaoEstoque] = useState(false);
  const [success, setSuccess] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadInfo, setUploadInfo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [itensGeradosDoEstoque, setItensGeradosDoEstoque] = useState<ItemCompra[]>([]);

  const [formData, setFormData] = useState({
    data_pedido: new Date().toISOString().split("T")[0],
    fornecedor: "",
    categoria: "",
    observacao_geral: "",
  });

  const [novoItem, setNovoItem] = useState({
    produto: "",
    quantidade: "",
    unidade: "un",
    valor_unitario: "",
  });

  const [editandoItem, setEditandoItem] = useState<string | null>(null);
  const [extraindo, setExtraindo] = useState(false);
  const [erroExtracao, setErroExtracao] = useState<string | null>(null);

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [textoLista, setTextoLista] = useState("");
  const [importando, setImportando] = useState(false);
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorOutro, setFornecedorOutro] = useState(false);
  const [fornecedorCustom, setFornecedorCustom] = useState("");

  const [erroListaEstoque, setErroListaEstoque] = useState<string | null>(null);

  const [empresaId, setEmpresaId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const empresaIdStorage =
      window.localStorage.getItem("empresa_id") ||
      window.localStorage.getItem("pId") ||
      window.localStorage.getItem("pizzariaId") ||
      "";

    const userEmailStorage = window.localStorage.getItem("userEmail") || "";

    setEmpresaId(localUser?.empresa_id || empresaIdStorage);
    setUserEmail(localUser?.email || userEmailStorage);
  }, [localUser]);

  function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
    return {
      "x-empresa-id": empresaId,
      "x-user-email": userEmail,
      ...extra,
    };
  }

  useEffect(() => {
    if (!empresaId && !userEmail) return;
    void fetchFornecedores();
  }, [empresaId, userEmail]);

  async function fetchFornecedores() {
    try {
      const res = await fetch("/api/fornecedores", {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setFornecedores(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao carregar fornecedores:", e);
    }
  }

  function mapItemEstoqueParaCompra(item: ItemListaEstoque, index: number): ItemCompra {
    const produto =
      item.produto ||
      item.nome ||
      item.nome_produto ||
      `Item ${index + 1}`;

    const quantidadeBase =
      item.quantidade_sugerida ??
      item.quantidade ??
      item.qtd ??
      1;

    const unidade =
      item.unidade ||
      item.unidade_medida ||
      "un";

    return {
      id: `estoque-${Date.now()}-${index}`,
      produto: String(produto),
      quantidade: String(quantidadeBase || 1),
      unidade: String(unidade),
      valor_unitario: "",
      origem: "estoque",
      observacao: item.observacao || "Gerado automaticamente a partir da conferência de estoque",
    };
  }

  async function gerarListaDoEstoque() {
    setLoadingSugestaoEstoque(true);
    setErroListaEstoque(null);

    try {
      const res = await fetch("/api/lista-compras/gerar-do-estoque", {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Não foi possível gerar a lista automática.");
      }

      const data = await res.json();

      const listaBruta =
        data?.itens ||
        data?.lista ||
        data?.produtos ||
        data?.resultado ||
        [];

      if (!Array.isArray(listaBruta) || listaBruta.length === 0) {
        setItensGeradosDoEstoque([]);
        setErroListaEstoque("Nenhum item foi sugerido pela análise do estoque.");
        return;
      }

      const novosItens = listaBruta.map(mapItemEstoqueParaCompra);
      setItensGeradosDoEstoque(novosItens);

      if (!showForm) {
        setShowForm(true);
      }

      if (!formData.categoria && data?.categoria) {
        const categoriaResposta = String(data.categoria).toLowerCase();
        const categoriaNormalizada = categoriasOptions.find(
          (c) =>
            c.label.toLowerCase() === categoriaResposta ||
            c.value.toLowerCase() === categoriaResposta
        );

        if (categoriaNormalizada) {
          setFormData((prev) => ({ ...prev, categoria: categoriaNormalizada.value }));
        }
      }
    } catch (error) {
      console.error("Erro ao gerar lista do estoque:", error);
      setErroListaEstoque(
        error instanceof Error ? error.message : "Erro ao gerar lista automática."
      );
    } finally {
      setLoadingSugestaoEstoque(false);
    }
  }

  function adicionarItensGeradosAoPedido() {
    if (itensGeradosDoEstoque.length === 0) return;

    const existentes = new Set(itens.map((item) => item.produto.trim().toLowerCase()));

    const novos = itensGeradosDoEstoque.filter(
      (item) => !existentes.has(item.produto.trim().toLowerCase())
    );

    setItens((prev) => [...prev, ...novos]);
  }

  async function extrairDadosIA(file: File) {
    if (!file.type.startsWith("image/")) {
      setErroExtracao(
        "Extração automática disponível apenas para imagens. Para PDF, anexe normalmente ou adicione os itens manualmente."
      );
      return;
    }

    setExtraindo(true);
    setErroExtracao(null);

    try {
      const form = new FormData();
      form.append("arquivo", file);

      const response = await fetch("/api/ia/ler-nota", {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      });

      const dados = await response.json();

      if (dados.error) {
        setErroExtracao(dados.error);
        return;
      }

      if (dados.fornecedor) {
        setFormData((prev) => ({
          ...prev,
          fornecedor: prev.fornecedor || String(dados.fornecedor),
        }));
      }

      if (dados.categoria_sugerida) {
        const categoriaSugerida = String(dados.categoria_sugerida).toLowerCase();

        const categoriaNormalizada = categoriasOptions.find(
          (c) =>
            c.label.toLowerCase() === categoriaSugerida ||
            c.value.toLowerCase() === categoriaSugerida
        );

        if (categoriaNormalizada) {
          setFormData((prev) => ({
            ...prev,
            categoria: prev.categoria || categoriaNormalizada.value,
          }));
        }
      }

      if (dados.data) {
        setFormData((prev) => ({ ...prev, data_pedido: String(dados.data) }));
      }

      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        const novosItens: ItemCompra[] = dados.itens
          .map((item: any, index: number) => ({
            id: `ia-${Date.now()}-${index}`,
            produto: String(item.produto || ""),
            quantidade: String(item.quantidade || 1),
            unidade: String(item.unidade || "un"),
            valor_unitario: String(item.valor_unitario || ""),
            origem: "ia" as const,
          }))
          .filter((item: ItemCompra) => item.produto);

        if (novosItens.length > 0) {
          setItens((prev) => [...prev, ...novosItens]);
        }
      }
    } catch (error) {
      console.error("Erro ao extrair dados:", error);
      setErroExtracao("Erro ao processar imagem. Adicione os itens manualmente.");
    } finally {
      setExtraindo(false);
    }
  }

  async function importarListaTexto() {
    if (!textoLista.trim()) return;

    setImportando(true);
    setErroImportacao(null);

    try {
      const response = await fetch("/api/ia/interpretar-lista", {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ texto: textoLista }),
      });

      const dados = await response.json();

      if (dados.error) {
        setErroImportacao(dados.error);
        return;
      }

      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        const novosItens: ItemCompra[] = dados.itens
          .map((item: any, index: number) => ({
            id: `texto-${Date.now()}-${index}`,
            produto: String(item.produto || ""),
            quantidade: String(item.quantidade || 1),
            unidade: String(item.unidade || "un"),
            valor_unitario: "",
            origem: "texto" as const,
          }))
          .filter((item: ItemCompra) => item.produto);

        if (novosItens.length > 0) {
          setItens((prev) => [...prev, ...novosItens]);
          setShowImportDialog(false);
          setTextoLista("");
        } else {
          setErroImportacao("Nenhum item encontrado no texto.");
        }
      } else {
        setErroImportacao("Não foi possível identificar itens no texto.");
      }
    } catch (error) {
      console.error("Erro ao importar lista:", error);
      setErroImportacao("Erro ao processar texto.");
    } finally {
      setImportando(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadInfo(file.name);
    setErroExtracao(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      void extrairDadosIA(file);
    } else {
      setPreviewUrl(null);
    }
  }

  function removeImage() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadInfo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function adicionarItem() {
    if (!novoItem.produto || !novoItem.quantidade) return;

    const item: ItemCompra = {
      id: Date.now().toString(),
      produto: novoItem.produto,
      quantidade: novoItem.quantidade,
      unidade: novoItem.unidade,
      valor_unitario: novoItem.valor_unitario || "",
      origem: "manual",
    };

    setItens((prev) => [...prev, item]);
    setNovoItem({ produto: "", quantidade: "", unidade: "un", valor_unitario: "" });
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((item) => item.id !== id));

    if (editandoItem === id) {
      setEditandoItem(null);
      setNovoItem({ produto: "", quantidade: "", unidade: "un", valor_unitario: "" });
    }
  }

  function editarItem(item: ItemCompra) {
    setEditandoItem(item.id);
    setNovoItem({
      produto: item.produto,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valor_unitario: item.valor_unitario,
    });
  }

  function salvarEdicao() {
    if (!novoItem.produto || !novoItem.quantidade || !editandoItem) return;

    setItens((prev) =>
      prev.map((item) =>
        item.id === editandoItem
          ? {
              ...item,
              produto: novoItem.produto,
              quantidade: novoItem.quantidade,
              unidade: novoItem.unidade,
              valor_unitario: novoItem.valor_unitario,
            }
          : item
      )
    );

    setEditandoItem(null);
    setNovoItem({ produto: "", quantidade: "", unidade: "un", valor_unitario: "" });
  }

  function cancelarEdicao() {
    setEditandoItem(null);
    setNovoItem({ produto: "", quantidade: "", unidade: "un", valor_unitario: "" });
  }

  function calcularTotal() {
    return itens.reduce((total, item) => {
      const qtd = Number.parseFloat(item.quantidade) || 0;
      const valor = Number.parseFloat(item.valor_unitario) || 0;
      return total + qtd * valor;
    }, 0);
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  const totalItens = useMemo(() => itens.length, [itens]);
  const totalEstimado = useMemo(() => calcularTotal(), [itens]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (itens.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("data_pedido", formData.data_pedido);
      data.append("fornecedor", formData.fornecedor);
      data.append("categoria", formData.categoria);
      data.append("valor_previsto", totalEstimado.toString());
      data.append("observacao", formData.observacao_geral || "");
      data.append(
        "itens",
        JSON.stringify(
          itens.map((item) => ({
            produto: item.produto,
            quantidade_pedida: Number.parseFloat(item.quantidade) || 0,
            unidade: item.unidade,
            valor_unitario: Number.parseFloat(item.valor_unitario) || 0,
            observacao: item.observacao || null,
          }))
        )
      );

      if (selectedFile) {
        data.append("anexo", selectedFile);
      }

      const response = await fetch("/api/lancamentos", {
        method: "POST",
        headers: getAuthHeaders(),
        body: data,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao salvar provisão");
      }

      setSuccess(true);

      setFormData({
        data_pedido: new Date().toISOString().split("T")[0],
        fornecedor: "",
        categoria: "",
        observacao_geral: "",
      });
      setItens([]);
      setItensGeradosDoEstoque([]);
      setFornecedorOutro(false);
      setFornecedorCustom("");
      removeImage();

      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 1800);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao salvar a provisão");
    } finally {
      setLoading(false);
    }
  }

  function origemLabel(origem?: ItemCompra["origem"]) {
    if (origem === "estoque") return "Estoque";
    if (origem === "ia") return "IA";
    if (origem === "texto") return "Texto";
    return "Manual";
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Compra registrada!</h2>
          <p className="text-gray-600 mt-2">A provisão foi enviada para o financeiro.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>

          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Pappi Gestor" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800">Pappi Gestor</h1>
              <p className="text-xs text-gray-500">Setor de Compras Inteligente</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!showForm ? (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-orange-200 px-4 py-2 text-sm text-orange-700 mb-4">
                <Bot className="w-4 h-4" />
                Comprador conectado ao estoque e à IA
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Central de Compras
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Gere uma nova compra a partir da conferência do estoque, importe uma lista pronta ou monte tudo manualmente.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-0 shadow-lg shadow-orange-500/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center mb-4">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Gerar do estoque
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Usa a análise da conferência para sugerir itens com reposição mais urgente.
                  </p>
                  <Button
                    onClick={() => void gerarListaDoEstoque()}
                    disabled={loadingSugestaoEstoque}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    {loadingSugestaoEstoque ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar lista automática
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg shadow-purple-500/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center mb-4">
                    <ClipboardPaste className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Importar lista
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Cole um texto livre e a IA transforma em itens estruturados para compra.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(true);
                      setShowImportDialog(true);
                    }}
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <ClipboardPaste className="w-4 h-4 mr-2" />
                    Importar por texto
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg shadow-blue-500/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Montar manualmente
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Crie uma nova provisão do zero, com fornecedor, categoria e itens detalhados.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(true)}
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova compra manual
                  </Button>
                </CardContent>
              </Card>
            </div>

            {erroListaEstoque && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{erroListaEstoque}</span>
              </div>
            )}

            {itensGeradosDoEstoque.length > 0 && (
              <Card className="border-0 shadow-xl shadow-orange-500/10">
                <CardHeader className="border-b bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="w-5 h-5" />
                    Sugestão automática da conferência de estoque
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-sm text-gray-600">
                      Revise os itens sugeridos e envie para a compra com um clique.
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => void gerarListaDoEstoque()}
                        disabled={loadingSugestaoEstoque}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingSugestaoEstoque ? "animate-spin" : ""}`} />
                        Atualizar
                      </Button>
                      <Button
                        onClick={adicionarItensGeradosAoPedido}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Usar na compra
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {itensGeradosDoEstoque.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-orange-100 bg-orange-50/60 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">{item.produto}</p>
                            <p className="text-sm text-gray-600">
                              Sugerido: {item.quantidade} {item.unidade}
                            </p>
                            {item.observacao ? (
                              <p className="text-xs text-gray-500 mt-1">{item.observacao}</p>
                            ) : null}
                          </div>

                          <span className="text-xs px-2 py-1 rounded-full bg-white border border-orange-200 text-orange-700">
                            Estoque
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-0 shadow-xl shadow-orange-500/10">
              <CardHeader className="border-b bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nova Provisão de Compra
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data do Pedido</Label>
                      <Input
                        type="date"
                        value={formData.data_pedido}
                        onChange={(e) =>
                          setFormData({ ...formData, data_pedido: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) =>
                          setFormData({ ...formData, categoria: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriasOptions.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fornecedor</Label>

                    {!fornecedorOutro ? (
                      <Select
                        value={formData.fornecedor}
                        onValueChange={(value) => {
                          if (value === "__outro__") {
                            setFornecedorOutro(true);
                            setFormData({ ...formData, fornecedor: "" });
                          } else {
                            setFormData({ ...formData, fornecedor: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {fornecedores.map((f) => {
                            const nome = f.nome_fantasia || f.razao_social || "";
                            return (
                              <SelectItem key={String(f.id)} value={nome}>
                                {nome}
                              </SelectItem>
                            );
                          })}
                          <SelectItem value="__outro__">
                            + Outro fornecedor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Digite o nome do fornecedor"
                          value={fornecedorCustom}
                          onChange={(e) => {
                            setFornecedorCustom(e.target.value);
                            setFormData({ ...formData, fornecedor: e.target.value });
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFornecedorOutro(false);
                            setFornecedorCustom("");
                            setFormData((prev) => ({ ...prev, fornecedor: "" }));
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Itens da compra
                    </Label>

                    {itens.length > 0 && (
                      <div className="space-y-3">
                        {itens.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 bg-orange-50 rounded-xl p-4 border border-orange-100"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800">{item.produto}</span>
                                <span className="text-[11px] px-2 py-1 rounded-full bg-white border text-gray-600">
                                  {origemLabel(item.origem)}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600 mt-1">
                                {item.quantidade} {item.unidade}
                                {item.valor_unitario
                                  ? ` × ${formatCurrency(Number.parseFloat(item.valor_unitario) || 0)}`
                                  : " × sem valor informado"}
                              </div>

                              {item.observacao ? (
                                <p className="text-xs text-gray-500 mt-1">{item.observacao}</p>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-orange-600 text-sm">
                                {formatCurrency(
                                  (Number.parseFloat(item.quantidade) || 0) *
                                    (Number.parseFloat(item.valor_unitario) || 0)
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => editarItem(item)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => removerItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remover"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                          <span className="font-semibold text-gray-700">
                            Total estimado
                          </span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatCurrency(totalEstimado)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12 md:col-span-4">
                          <Input
                            placeholder="Produto"
                            value={novoItem.produto}
                            onChange={(e) =>
                              setNovoItem({ ...novoItem, produto: e.target.value })
                            }
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Qtd"
                            value={novoItem.quantidade}
                            onChange={(e) =>
                              setNovoItem({ ...novoItem, quantidade: e.target.value })
                            }
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <Select
                            value={novoItem.unidade}
                            onValueChange={(value) =>
                              setNovoItem({ ...novoItem, unidade: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIDADES.map((un) => (
                                <SelectItem key={un} value={un}>
                                  {un}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="R$ unit."
                            value={novoItem.valor_unitario}
                            onChange={(e) =>
                              setNovoItem({ ...novoItem, valor_unitario: e.target.value })
                            }
                          />
                        </div>

                        <div className="col-span-12 md:col-span-2">
                          {editandoItem ? (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                onClick={salvarEdicao}
                                className="flex-1 bg-green-500 hover:bg-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={cancelarEdicao}
                                className="flex-1"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              onClick={adicionarItem}
                              disabled={!novoItem.produto || !novoItem.quantidade}
                              className="w-full bg-orange-500 hover:bg-orange-600"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowImportDialog(true)}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <ClipboardPaste className="w-4 h-4 mr-2" />
                      Importar lista com IA
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void gerarListaDoEstoque()}
                      disabled={loadingSugestaoEstoque}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Buscar do estoque
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Anexo de cotação, cupom ou nota
                      {extraindo ? (
                        <span className="flex items-center gap-1 text-xs text-orange-600 font-normal">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Extraindo com IA...
                        </span>
                      ) : null}
                    </Label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {erroExtracao ? (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        {erroExtracao}
                      </div>
                    ) : null}

                    {selectedFile ? (
                      <div className="relative">
                        {selectedFile.type === "application/pdf" ? (
                          <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-orange-200 flex flex-col items-center justify-center gap-3">
                            <FileText className="w-16 h-16 text-red-500" />
                            <span className="text-sm text-gray-700 font-medium px-4 text-center truncate max-w-full">
                              {uploadInfo}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={previewUrl || ""}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-xl border-2 border-orange-200"
                          />
                        )}

                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-orange-400 bg-orange-50 rounded-xl flex flex-col items-center justify-center gap-3 text-orange-700 hover:bg-orange-100 hover:border-orange-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg">
                          <Upload className="w-5 h-5" />
                          <span className="font-semibold">Anexar arquivo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Camera className="w-4 h-4" />
                          <span>Foto, imagem ou PDF</span>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-xs text-gray-500">
                          Imagens podem ser lidas automaticamente pela IA
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Observação geral</Label>
                    <Textarea
                      placeholder="Informações úteis para o financeiro ou para a compra..."
                      value={formData.observacao_geral}
                      onChange={(e) =>
                        setFormData({ ...formData, observacao_geral: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setItens([]);
                        setItensGeradosDoEstoque([]);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading || !formData.categoria || itens.length === 0}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>Registrar ({formatCurrency(totalEstimado)})</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg shadow-orange-500/10">
                <CardHeader>
                  <CardTitle className="text-base">Resumo da compra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                    <p className="text-xs text-gray-500">Itens</p>
                    <p className="text-2xl font-bold text-gray-800">{totalItens}</p>
                  </div>

                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <p className="text-xs text-gray-500">Total estimado</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(totalEstimado)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border p-4">
                    <p className="text-xs text-gray-500 mb-2">Checklist</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Categoria definida</span>
                        {formData.categoria ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Itens adicionados</span>
                        {itens.length > 0 ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Fornecedor informado</span>
                        {formData.fornecedor ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {itensGeradosDoEstoque.length > 0 ? (
                <Card className="border-0 shadow-lg shadow-blue-500/10">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      Itens sugeridos pelo estoque
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {itensGeradosDoEstoque.slice(0, 6).map((item) => (
                      <div key={item.id} className="rounded-lg border bg-gray-50 p-3">
                        <p className="font-medium text-gray-800">{item.produto}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantidade} {item.unidade}
                        </p>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={adicionarItensGeradosAoPedido}
                      className="w-full"
                    >
                      Usar itens sugeridos
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        )}

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Importar Lista com IA
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Cole ou digite a lista no formato que preferir. A IA tenta identificar produtos e quantidades automaticamente.
              </p>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 border">
                <strong>Exemplos aceitos:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>Fubá 2kg, Mussarela 5kg</li>
                  <li>Calabresa 4cx</li>
                  <li>10 un cebola, 5 kg tomate</li>
                  <li>Caixas 16-350</li>
                </ul>
              </div>

              <Textarea
                placeholder={`Cole sua lista aqui...\n\nEx: Fubá 2kg\nMussarela 5kg\nCalabresa 4cx`}
                value={textoLista}
                onChange={(e) => {
                  setTextoLista(e.target.value);
                  setErroImportacao(null);
                }}
                className="min-h-[150px] resize-none"
              />

              {erroImportacao ? (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  {erroImportacao}
                </div>
              ) : null}

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Os itens entram sem valor unitário. Você pode completar depois.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setTextoLista("");
                  setErroImportacao(null);
                }}
              >
                Cancelar
              </Button>

              <Button
                onClick={() => void importarListaTexto()}
                disabled={importando || !textoLista.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {importando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Interpretando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Importar itens
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { CATEGORIAS } from "@/shared/types";

import {
  Plus,
  Camera,
  X,
  Check,
  ArrowLeft,
  Trash2,
  Package,
  Pencil,
  FileText,
  Loader2,
  Sparkles,
  ClipboardPaste,
  Upload,
} from "lucide-react";

const LOGO_URL =
  "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

interface ItemCompra {
  id: string;
  produto: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
  razao_social: string;
}

interface CategoriaOption {
  label?: string;
  value?: string;
}

const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd"];

export default function CompradorPage() {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [formData, setFormData] = useState({
    data_pedido: new Date().toISOString().split("T")[0],
    fornecedor: "",
    categoria: "",
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

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const res = await fetch("/api/fornecedores", { cache: "no-store" });
        if (res.ok) {
          const data: Fornecedor[] = await res.json();
          setFornecedores(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Erro ao carregar fornecedores:", e);
      }
    };

    fetchFornecedores();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const categorias = useMemo(() => {
    return Array.isArray(CATEGORIAS) ? (CATEGORIAS as CategoriaOption[]) : [];
  }, []);

  const extrairDadosIA = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErroExtracao(
        "Extração automática disponível apenas para imagens. Para PDF, adicione os itens manualmente.",
      );
      return;
    }

    setExtraindo(true);
    setErroExtracao(null);

    try {
      const data = new FormData();
      data.append("arquivo", file);

      const response = await fetch("/api/ia/ler-nota", {
        method: "POST",
        body: data,
      });

      const dados = await response.json();

      if (dados.error) {
        setErroExtracao(dados.error);
        return;
      }

      if (dados.fornecedor) {
        setFormData((prev) =>
          prev.fornecedor ? prev : { ...prev, fornecedor: String(dados.fornecedor) },
        );
      }

      if (dados.categoria_sugerida) {
        const sugestao = String(dados.categoria_sugerida ?? "").trim().toLowerCase();

        const categoriaMatch = categorias.find((c) => {
          const label = String(c.label ?? "").trim().toLowerCase();
          const value = String(c.value ?? "").trim().toLowerCase();
          return label === sugestao || value === sugestao;
        });

        if (categoriaMatch?.value) {
          setFormData((prev) =>
            prev.categoria ? prev : { ...prev, categoria: String(categoriaMatch.value) },
          );
        }
      }

      if (dados.data) {
        setFormData((prev) => ({ ...prev, data_pedido: String(dados.data) }));
      }

      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        const novosItens: ItemCompra[] = dados.itens
          .map((item: any, index: number) => ({
            id: `ia-${Date.now()}-${index}`,
            produto: String(item?.produto || ""),
            quantidade: String(item?.quantidade || 1),
            unidade: String(item?.unidade || "un"),
            valor_unitario: String(item?.valor_unitario || 0),
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
  };

  const importarListaTexto = async () => {
    if (!textoLista.trim()) return;

    setImportando(true);
    setErroImportacao(null);

    try {
      const response = await fetch("/api/ia/interpretar-lista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            id: `import-${Date.now()}-${index}`,
            produto: String(item?.produto || ""),
            quantidade: String(item?.quantidade || 1),
            unidade: String(item?.unidade || "un"),
            valor_unitario: "0",
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
        setErroImportacao("Não foi possível identificar itens no texto. Tente reformular.");
      }
    } catch (error) {
      console.error("Erro ao importar lista:", error);
      setErroImportacao("Erro ao processar texto. Tente novamente.");
    } finally {
      setImportando(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setErroExtracao(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    extrairDadosIA(file);
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const adicionarItem = () => {
    if (!novoItem.produto || !novoItem.quantidade || !novoItem.valor_unitario) return;

    const item: ItemCompra = {
      id: Date.now().toString(),
      produto: novoItem.produto,
      quantidade: novoItem.quantidade,
      unidade: novoItem.unidade,
      valor_unitario: novoItem.valor_unitario,
    };

    setItens((prev) => [...prev, item]);
    setNovoItem({
      produto: "",
      quantidade: "",
      unidade: "un",
      valor_unitario: "",
    });
  };

  const removerItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id));

    if (editandoItem === id) {
      setEditandoItem(null);
      setNovoItem({
        produto: "",
        quantidade: "",
        unidade: "un",
        valor_unitario: "",
      });
    }
  };

  const editarItem = (item: ItemCompra) => {
    setEditandoItem(item.id);
    setNovoItem({
      produto: item.produto,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valor_unitario: item.valor_unitario,
    });
  };

  const salvarEdicao = () => {
    if (!novoItem.produto || !novoItem.quantidade || !novoItem.valor_unitario || !editandoItem) {
      return;
    }

    setItens((prev) =>
      prev.map((item) => (item.id === editandoItem ? { ...item, ...novoItem } : item)),
    );

    setEditandoItem(null);
    setNovoItem({
      produto: "",
      quantidade: "",
      unidade: "un",
      valor_unitario: "",
    });
  };

  const cancelarEdicao = () => {
    setEditandoItem(null);
    setNovoItem({
      produto: "",
      quantidade: "",
      unidade: "un",
      valor_unitario: "",
    });
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const qtd = parseFloat(item.quantidade) || 0;
      const valor = parseFloat(item.valor_unitario) || 0;
      return total + qtd * valor;
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const fornecedorSelecionado = fornecedorOutro ? fornecedorCustom : formData.fornecedor;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (itens.length === 0) {
      window.alert("Adicione pelo menos um item à compra");
      return;
    }

    if (!fornecedorSelecionado) {
      window.alert("Selecione um fornecedor");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("data_pedido", formData.data_pedido);
      data.append("fornecedor", fornecedorSelecionado);
      data.append("categoria", formData.categoria);
      data.append("valor_previsto", calcularTotal().toString());
      data.append(
        "itens",
        JSON.stringify(
          itens.map((item) => ({
            produto: item.produto,
            quantidade_pedida: parseFloat(item.quantidade),
            unidade: item.unidade,
            valor_unitario: parseFloat(item.valor_unitario),
          })),
        ),
      );

      if (selectedFile) {
        data.append("anexo", selectedFile);
      }

      const response = await fetch("/api/lancamentos", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar");
      }

      setSuccess(true);
      setFormData({
        data_pedido: new Date().toISOString().split("T")[0],
        fornecedor: "",
        categoria: "",
      });
      setFornecedorOutro(false);
      setFornecedorCustom("");
      setItens([]);
      removeImage();

      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar a provisão");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-green-500">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Provisão Registrada!</h2>
          <p className="mt-2 text-gray-600">O financeiro será notificado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors hover:bg-orange-100"
            aria-label="Voltar"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <Link href="/app" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Pappi Gestor" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800">Pappi Gestor</h1>
              <p className="text-xs text-gray-500">Setor de Compras</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {!showForm ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-800">Nova Provisão de Compra</h2>
              <p className="text-gray-600">Registre suas compras para o financeiro validar</p>
            </div>

            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="flex h-48 w-48 flex-col gap-3 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 hover:from-orange-600 hover:to-red-700"
            >
              <Plus className="h-16 w-16" />
              <span className="text-lg font-semibold">Nova Compra</span>
            </Button>
          </div>
        ) : (
          <Card className="border-0 shadow-xl shadow-orange-500/10">
            <CardHeader className="rounded-t-xl bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Provisão de Gasto
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="data_pedido">Data do Pedido</Label>
                    <Input
                      id="data_pedido"
                      type="date"
                      value={formData.data_pedido}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, data_pedido: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, categoria: value }))
                      }
                    >
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria, index) => {
                          const value = String(categoria.value ?? `categoria-${index}`);
                          const label = String(categoria.label ?? value);
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fornecedor</Label>

                  {!fornecedorOutro ? (
                    <div className="space-y-2">
                      <Select
                        value={formData.fornecedor}
                        onValueChange={(value) => {
                          if (value === "__outro__") {
                            setFornecedorOutro(true);
                            setFormData((prev) => ({ ...prev, fornecedor: "" }));
                            return;
                          }

                          setFormData((prev) => ({ ...prev, fornecedor: value }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {fornecedores.map((fornecedor) => {
                            const nome =
                              fornecedor.nome_fantasia?.trim() || fornecedor.razao_social?.trim();

                            return (
                              <SelectItem key={fornecedor.id} value={nome}>
                                {nome}
                              </SelectItem>
                            );
                          })}

                          <SelectItem value="__outro__">Outro fornecedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={fornecedorCustom}
                        onChange={(e) => setFornecedorCustom(e.target.value)}
                        placeholder="Digite o nome do fornecedor"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFornecedorOutro(false);
                          setFornecedorCustom("");
                        }}
                      >
                        Usar lista
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label>Anexo da Nota / Pedido</Label>
                      <p className="text-xs text-gray-500">
                        Envie imagem ou PDF. Para imagem, a IA tentará extrair dados automaticamente.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Anexar arquivo
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowImportDialog(true)}
                        className="gap-2"
                      >
                        <ClipboardPaste className="h-4 w-4" />
                        Importar lista
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {selectedFile && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {selectedFile.type.startsWith("image/") ? (
                              <Camera className="h-4 w-4 text-orange-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-orange-600" />
                            )}
                            <p className="truncate text-sm font-medium text-gray-800">
                              {selectedFile.name}
                            </p>
                          </div>

                          {extraindo && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-purple-700">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Extraindo dados com IA...
                            </p>
                          )}

                          {erroExtracao && (
                            <p className="mt-2 text-sm text-red-600">{erroExtracao}</p>
                          )}
                        </div>

                        <Button type="button" variant="ghost" size="icon" onClick={removeImage}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {previewUrl && (
                        <div className="mt-4 overflow-hidden rounded-lg border bg-white">
                          <img
                            src={previewUrl}
                            alt="Preview do anexo"
                            className="max-h-72 w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedFile && (
                    <div className="rounded-xl border border-dashed border-orange-200 bg-white/70 p-6 text-center">
                      <Upload className="mx-auto mb-3 h-8 w-8 text-orange-400" />
                      <p className="text-sm font-medium text-gray-700">
                        Nenhum arquivo anexado
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Você pode seguir sem anexo e lançar os itens manualmente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">Itens da Compra</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <Label htmlFor="produto">Produto</Label>
                      <Input
                        id="produto"
                        value={novoItem.produto}
                        onChange={(e) =>
                          setNovoItem((prev) => ({ ...prev, produto: e.target.value }))
                        }
                        placeholder="Ex: Mussarela"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="quantidade">Qtd</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        step="0.001"
                        value={novoItem.quantidade}
                        onChange={(e) =>
                          setNovoItem((prev) => ({ ...prev, quantidade: e.target.value }))
                        }
                        placeholder="1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Unidade</Label>
                      <Select
                        value={novoItem.unidade}
                        onValueChange={(value) =>
                          setNovoItem((prev) => ({ ...prev, unidade: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES.map((unidade) => (
                            <SelectItem key={unidade} value={unidade}>
                              {unidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3">
                      <Label htmlFor="valor_unitario">Valor Unit.</Label>
                      <Input
                        id="valor_unitario"
                        type="number"
                        step="0.01"
                        value={novoItem.valor_unitario}
                        onChange={(e) =>
                          setNovoItem((prev) => ({ ...prev, valor_unitario: e.target.value }))
                        }
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {editandoItem ? (
                      <>
                        <Button type="button" onClick={salvarEdicao} className="gap-2">
                          <Check className="h-4 w-4" />
                          Salvar edição
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelarEdicao}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={adicionarItem} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar item
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    {itens.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                        Nenhum item adicionado ainda.
                      </div>
                    ) : (
                      itens.map((item) => {
                        const subtotal =
                          (parseFloat(item.quantidade) || 0) *
                          (parseFloat(item.valor_unitario) || 0);

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-xl border bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-800">{item.produto}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantidade} {item.unidade} ×{" "}
                                {formatCurrency(parseFloat(item.valor_unitario) || 0)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="min-w-[110px] text-right font-semibold text-gray-800">
                                {formatCurrency(subtotal)}
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => editarItem(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removerItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/80">Valor previsto total</p>
                      <p className="text-3xl font-bold">{formatCurrency(calcularTotal())}</p>
                    </div>
                    <Sparkles className="h-8 w-8 text-white/80" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Registrar provisão
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Importar Lista com IA
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Cole ou digite sua lista de compras no formato que preferir. A IA vai interpretar
                automaticamente os produtos e quantidades.
              </p>

              <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-500">
                <strong>Exemplos aceitos:</strong>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>Fubá 2kg, Mussarela 5kg</li>
                  <li>Calabresa 4cx</li>
                  <li>10 un cebola, 5 kg tomate</li>
                  <li>Caixas 16-350 (interpretado como 16 caixas)</li>
                </ul>
              </div>

              <Textarea
                placeholder={"Cole sua lista aqui...\n\nEx: Fubá 2kg\nMussarela 5kg\nCalabresa 4cx"}
                value={textoLista}
                onChange={(e) => {
                  setTextoLista(e.target.value);
                  setErroImportacao(null);
                }}
                className="min-h-[150px] resize-none"
              />

              {erroImportacao && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                  {erroImportacao}
                </div>
              )}

              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Sparkles className="h-3 w-3" />
                Os itens serão adicionados sem valor unitário - preencha depois.
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
                onClick={importarListaTexto}
                disabled={importando || !textoLista.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {importando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Interpretando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Importar Itens
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
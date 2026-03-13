"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Database,
  Filter,
  Loader2,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tags,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/react-app/components/ui/badge";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Input } from "@/react-app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";

type ProdutoCatalogo = {
  id: string;
  nome: string;
  categoria: string;
  subcategoria?: string;
  unidadeMedida?: string;
  embalagem?: string;
  descricao?: string;
  sinonimos?: string[];
};

type ProdutoEmpresaResumo = {
  id: number | string;
  nome_produto?: string;
};

type ApiResponse = {
  produtos: ProdutoCatalogo[];
  total: number;
  exibidos: number;
  categorias: string[];
};

function getEmpresaId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pId") || localStorage.getItem("empresaId") || "";
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function CatalogoGlobalPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [produtosEmpresa, setProdutosEmpresa] = useState<ProdutoEmpresaResumo[]>([]);
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState("all");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoCatalogo | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const query = new URLSearchParams();
        if (termo.trim()) query.set("q", termo.trim());
        if (categoria !== "all") query.set("categoria", categoria);

        const empresaId = getEmpresaId();
        const headers = empresaId ? { "x-pizzaria-id": empresaId } : undefined;

        const [catalogoRes, produtosRes] = await Promise.allSettled([
          fetch(`/api/catalogo-global?${query.toString()}`, {
            cache: "no-store",
          }),
          fetch("/api/produtos", {
            cache: "no-store",
            headers,
          }),
        ]);

        if (!alive) return;

        if (catalogoRes.status !== "fulfilled" || !catalogoRes.value.ok) {
          throw new Error("Não foi possível carregar o catálogo global.");
        }

        const data = (await catalogoRes.value.json()) as ApiResponse;
        setProdutos(data.produtos || []);
        setCategorias(data.categorias || []);

        if (produtosRes.status === "fulfilled" && produtosRes.value.ok) {
          const dataProdutos = await produtosRes.value.json();
          setProdutosEmpresa(Array.isArray(dataProdutos) ? dataProdutos : []);
        } else {
          setProdutosEmpresa([]);
        }
      } catch (e: any) {
        if (!alive) return;
        setErro(e?.message || "Erro ao carregar catálogo.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    carregar();
    return () => {
      alive = false;
    };
  }, [termo, categoria]);

  const nomesJaUsados = useMemo(() => {
    return new Set(
      produtosEmpresa
        .map((item) => item.nome_produto)
        .filter(Boolean)
        .map((item) => normalizar(String(item)))
    );
  }, [produtosEmpresa]);

  const resumoCategorias = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const item of produtos) {
      mapa.set(item.categoria, (mapa.get(item.categoria) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [produtos]);

  const itensNovosPotenciais = useMemo(() => {
    return produtos.filter((item) => !nomesJaUsados.has(normalizar(item.nome))).length;
  }, [produtos, nomesJaUsados]);

  const handleAdicionarAoNegocio = async (item: ProdutoCatalogo) => {
    const empresaId = getEmpresaId();
    if (!empresaId) {
      setFeedback("Empresa ativa não encontrada. Faça login novamente e tente de novo.");
      return;
    }

    if (nomesJaUsados.has(normalizar(item.nome))) {
      setFeedback(`"${item.nome}" já existe em Meus Produtos.`);
      return;
    }

    setIsAdding(item.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pizzaria-id": empresaId,
        },
        body: JSON.stringify({
          nome_produto: item.nome,
          categoria_produto: item.categoria,
          unidade_medida: item.unidadeMedida || "kg",
          peso_embalagem: item.embalagem || null,
          descricao: item.descricao || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Não foi possível criar o produto na empresa.");
      }

      setProdutosEmpresa((prev) => [...prev, { id: `local-${item.id}`, nome_produto: item.nome }]);
      setFeedback(`"${item.nome}" foi enviado para Meus Produtos e já pode entrar no estoque.`);
    } catch (e: any) {
      setFeedback(e?.message || "Falha ao adicionar produto ao negócio.");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="space-y-6 dark:text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              Biblioteca inteligente
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Catálogo Global do Pappi
          </h1>
          <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Escolha um item genérico, sem marca, e transforme em produto do seu negócio.
            Depois ele entra em estoque, compras, CMV, precificação e promoções com contexto real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/produtos">
              <Package className="mr-2 h-4 w-4" />
              Ver Meus Produtos
            </Link>
          </Button>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/app/produtos-master">
              <Sparkles className="mr-2 h-4 w-4" />
              Ver inteligência
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Itens visíveis</p>
            <p className="mt-1 text-2xl font-bold">{produtos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Categorias</p>
            <p className="mt-1 text-2xl font-bold">{categorias.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Já usados pela empresa</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{produtosEmpresa.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Novos potenciais</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{itensNovosPotenciais}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Busque por nome, categoria, uso, embalagem ou sinônimo"
                className="pl-9 dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="dark:border-gray-600 dark:bg-gray-900">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-900">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setTermo(""); setCategoria("all"); }}>
              <Filter className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
          {feedback && (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
              {feedback}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4 text-orange-600" />
              Itens prontos para virar produto da empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando catálogo...
              </div>
            ) : erro ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {erro}
              </div>
            ) : produtos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Nenhum item encontrado com esse filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {produtos.map((item) => {
                  const jaExiste = nomesJaUsados.has(normalizar(item.nome));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProdutoSelecionado(item)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        produtoSelecionado?.id === item.id
                          ? "border-orange-500 bg-orange-50 shadow-sm dark:border-orange-500 dark:bg-orange-950/30"
                          : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900/40"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.nome}</h3>
                            <Badge variant="secondary">{item.categoria}</Badge>
                            {jaExiste && (
                              <Badge className="bg-green-600 text-white hover:bg-green-600">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Já no negócio
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.descricao || "Item-base sem marca, pronto para personalizar na empresa."}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {item.subcategoria && <span>Subcategoria: {item.subcategoria}</span>}
                            {item.unidadeMedida && <span>Unidade: {item.unidadeMedida}</span>}
                            {item.embalagem && <span>Embalagem: {item.embalagem}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-orange-600" />
              Leitura estratégica do item base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {produtoSelecionado ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{produtoSelecionado.nome}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {produtoSelecionado.descricao || "Use este item como base. Depois complete marca, fornecedor, custo, embalagem real e ficha técnica no cadastro da empresa."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{produtoSelecionado.categoria}</Badge>
                  {produtoSelecionado.subcategoria ? (
                    <Badge variant="outline">{produtoSelecionado.subcategoria}</Badge>
                  ) : null}
                  {produtoSelecionado.unidadeMedida ? (
                    <Badge variant="outline">Unidade: {produtoSelecionado.unidadeMedida}</Badge>
                  ) : null}
                </div>

                {produtoSelecionado.sinonimos?.length ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Termos relacionados
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {produtoSelecionado.sinonimos.slice(0, 8).map((item) => (
                        <Badge key={item} variant="outline" className="gap-1">
                          <Tags className="h-3 w-3" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <ShoppingCart className="h-4 w-4" />
                    O que acontece quando você usar este item no negócio
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• Vira um produto da empresa e passa a aparecer no estoque.</li>
                    <li>• Pode receber marca, fornecedor, código de barras e custo real.</li>
                    <li>• Entra na inteligência de CMV, precificação e promoção.</li>
                  </ul>
                </div>

                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleAdicionarAoNegocio(produtoSelecionado)}
                  disabled={isAdding === produtoSelecionado.id || nomesJaUsados.has(normalizar(produtoSelecionado.nome))}
                >
                  {isAdding === produtoSelecionado.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : nomesJaUsados.has(normalizar(produtoSelecionado.nome)) ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {nomesJaUsados.has(normalizar(produtoSelecionado.nome))
                    ? "Já existe em Meus Produtos"
                    : "Usar no meu negócio"}
                </Button>
              </>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
                <Package className="mb-4 h-10 w-10 text-orange-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Selecione um item do catálogo</p>
                <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                  Você verá descrição, unidade, sinônimos e a explicação de como esse item entra em produtos, estoque e inteligência de margem.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Categorias com mais cobertura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumoCategorias.map(([nome, total]) => (
              <div key={nome} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">{nome}</span>
                <Badge>{total} itens</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Como isso sustenta a IA gestora</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">1. Padroniza a base</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">A IA passa a entender melhor o que é muçarela, molho, embalagem ou bebida sem depender de nomes soltos.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">2. Forma opinião de custo</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quando o item vira produto da empresa, a IA passa a cruzar categoria, fornecedor e custo para sugerir economia.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">3. Afeta margem e promoção</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Com produto + custo + uso, o sistema aponta o que reajustar, promover, negociar ou substituir.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

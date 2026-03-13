"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  BrainCircuit,
  Lightbulb,
  Loader2,
  Package,
  Percent,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/react-app/components/ui/badge";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Input } from "@/react-app/components/ui/input";

type ProdutoEmpresa = {
  id: number | string;
  nome_produto?: string;
  nome_padrao?: string;
  categoria_produto?: string;
  categoria?: string;
  unidade_medida?: string;
  preco_referencia?: number | null;
  ultimo_preco_pago?: number | null;
  marca?: string | null;
  fornecedor_nome?: string | null;
  curva_abc?: string | null;
  peso_embalagem?: string | null;
};

type Fornecedor = {
  id: number | string;
  nome_fantasia: string;
};

type InsightCard = {
  titulo: string;
  resumo: string;
  impacto: string;
  acao: string;
  nivel: "alto" | "medio" | "baixo";
};

type ScoreProduto = ProdutoEmpresa & {
  custoBase: number | null;
  scoreEconomia: number;
  scorePromocao: number;
  scoreRisco: number;
  scoreFornecedor: number;
};

function getEmpresaId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pId") || localStorage.getItem("empresaId") || "";
}

function currency(valor?: number | null) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function getProdutoNome(item: ProdutoEmpresa) {
  return item.nome_produto || item.nome_padrao || "Produto sem nome";
}

function getCategoria(item: ProdutoEmpresa) {
  return item.categoria_produto || item.categoria || "Sem categoria";
}

function getPrecoBase(item: ProdutoEmpresa) {
  return item.ultimo_preco_pago ?? item.preco_referencia ?? null;
}

function scoreProduto(item: ProdutoEmpresa): ScoreProduto {
  const categoria = getCategoria(item).toLowerCase();
  const custoBase = getPrecoBase(item);

  let scoreEconomia = 40;
  let scorePromocao = 40;
  let scoreRisco = 35;
  let scoreFornecedor = item.fornecedor_nome ? 70 : 25;

  if (categoria.includes("latic") || categoria.includes("carne")) {
    scoreRisco += 30;
    scoreEconomia += 20;
  }

  if (categoria.includes("embalag")) {
    scoreRisco += 20;
    scoreEconomia += 15;
    scorePromocao -= 10;
  }

  if (categoria.includes("bebid") || categoria.includes("sobrem")) {
    scorePromocao += 30;
  }

  if (custoBase == null) {
    scoreRisco += 25;
    scoreEconomia += 10;
    scorePromocao -= 15;
  } else {
    if (custoBase > 60) {
      scoreRisco += 20;
      scoreEconomia += 15;
    } else if (custoBase < 15) {
      scorePromocao += 10;
    }
  }

  if (item.curva_abc?.toUpperCase() === "A") {
    scoreRisco += 20;
    scoreEconomia += 15;
    scorePromocao += 10;
  }

  if (item.fornecedor_nome) {
    scoreEconomia += 10;
  }

  return {
    ...item,
    custoBase,
    scoreEconomia: Math.max(0, Math.min(100, scoreEconomia)),
    scorePromocao: Math.max(0, Math.min(100, scorePromocao)),
    scoreRisco: Math.max(0, Math.min(100, scoreRisco)),
    scoreFornecedor: Math.max(0, Math.min(100, scoreFornecedor)),
  };
}

function criarOpiniaoIA(produtos: ScoreProduto[], fornecedores: Fornecedor[]): InsightCard[] {
  if (produtos.length === 0) {
    return [
      {
        titulo: "Base operacional ainda vazia",
        resumo: "A IA precisa de produtos da empresa para gerar opiniões reais de CMV, economia e promoção.",
        impacto: "Sem produtos cadastrados não há leitura de custo nem de sensibilidade.",
        acao: "Alimente Meus Produtos a partir do Catálogo Global e conecte fornecedores prioritários.",
        nivel: "medio",
      },
    ];
  }

  const semPreco = produtos.filter((p) => p.custoBase == null);
  const maiorRisco = [...produtos].sort((a, b) => b.scoreRisco - a.scoreRisco)[0];
  const melhorPromocao = [...produtos].sort((a, b) => b.scorePromocao - a.scorePromocao)[0];
  const maiorEconomia = [...produtos].sort((a, b) => b.scoreEconomia - a.scoreEconomia)[0];
  const semFornecedor = produtos.filter((p) => !p.fornecedor_nome);

  const insights: InsightCard[] = [];

  if (maiorRisco) {
    insights.push({
      titulo: `Risco de margem concentrado em ${getProdutoNome(maiorRisco)}`,
      resumo: `${getCategoria(maiorRisco)} apareceu como item mais sensível nesta leitura inicial da IA.`,
      impacto: `Score de risco ${maiorRisco.scoreRisco}/100. Oscilações aqui tendem a bater em CMV, combo e preço final.`,
      acao: "Monitore custo, rendimento e fornecedor desse item antes de rodar promoções agressivas.",
      nivel: "alto",
    });
  }

  if (maiorEconomia) {
    insights.push({
      titulo: `Maior oportunidade de economia: ${getProdutoNome(maiorEconomia)}`,
      resumo: `A IA identificou espaço de ganho em negociação, troca de fornecedor ou revisão de embalagem.`,
      impacto: `Score de economia ${maiorEconomia.scoreEconomia}/100. Essa categoria merece revisão de compra.`,
      acao: "Compare pelo menos dois fornecedores e acompanhe histórico de custo desse item.",
      nivel: "alto",
    });
  }

  if (melhorPromocao) {
    insights.push({
      titulo: `Bom candidato para promoção: ${getProdutoNome(melhorPromocao)}`,
      resumo: `O produto apareceu com boa compatibilidade para ação promocional controlada.`,
      impacto: `Score promocional ${melhorPromocao.scorePromocao}/100. Pode ser usado como âncora de venda com menos risco relativo.`,
      acao: "Valide giro, margem e composição do combo antes de aplicar desconto amplo.",
      nivel: "medio",
    });
  }

  if (semPreco.length > 0) {
    insights.push({
      titulo: "Produtos sem custo estão cegando a IA",
      resumo: `${semPreco.length} item(ns) ainda não têm preço de referência ou último custo pago.`,
      impacto: "Sem custo confiável, a opinião sobre CMV, margem e promoção fica parcial.",
      acao: "Preencha primeiro os itens mais usados, os de curva A e os de maior sensibilidade.",
      nivel: "alto",
    });
  }

  if (semFornecedor.length > 0 || fornecedores.length > 0) {
    insights.push({
      titulo: "Inteligência por fornecedor pode ficar muito mais forte",
      resumo: `${fornecedores.length} fornecedor(es) e ${semFornecedor.length} item(ns) sem vínculo mostram o próximo gargalo de decisão.`,
      impacto: "A IA passa a opinar melhor quando sabe quem entrega melhor, mais barato e com regularidade.",
      acao: "Conecte fornecedor principal aos itens críticos para liberar ranking real de custo-benefício.",
      nivel: "medio",
    });
  }

  return insights.slice(0, 5);
}

export default function ProdutosMasterPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoEmpresa[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let alive = true;

    async function carregar() {
      const empresaId = getEmpresaId();
      try {
        setLoading(true);
        setErro(null);

        const headers = empresaId ? { "x-pizzaria-id": empresaId } : undefined;

        const [prodRes, fornRes] = await Promise.allSettled([
          fetch("/api/produtos", { cache: "no-store", headers }),
          fetch("/api/fornecedores", { cache: "no-store", headers }),
        ]);

        if (!alive) return;

        if (prodRes.status === "fulfilled" && prodRes.value.ok) {
          setProdutos(await prodRes.value.json());
        } else {
          setProdutos([]);
        }

        if (fornRes.status === "fulfilled" && fornRes.value.ok) {
          const data = await fornRes.value.json();
          setFornecedores(Array.isArray(data) ? data : []);
        } else {
          setFornecedores([]);
        }
      } catch (e: any) {
        if (!alive) return;
        setErro(e?.message || "Erro ao carregar inteligência de produtos.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    carregar();
    return () => {
      alive = false;
    };
  }, []);

  const produtosScorados = useMemo(() => produtos.map(scoreProduto), [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtosScorados;

    return produtosScorados.filter((item) => {
      const texto = [getProdutoNome(item), getCategoria(item), item.fornecedor_nome, item.marca]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, produtosScorados]);

  const stats = useMemo(() => {
    const comPreco = produtosScorados.filter((item) => item.custoBase != null);
    const comFornecedor = produtosScorados.filter((item) => !!item.fornecedor_nome);
    const criticos = produtosScorados.filter((item) => item.scoreRisco >= 70);

    return {
      total: produtosScorados.length,
      comPreco: comPreco.length,
      comFornecedor: comFornecedor.length,
      criticos: criticos.length,
    };
  }, [produtosScorados]);

  const opinioes = useMemo(() => criarOpiniaoIA(produtosScorados, fornecedores), [produtosScorados, fornecedores]);

  const topEconomia = useMemo(() => [...produtosFiltrados].sort((a, b) => b.scoreEconomia - a.scoreEconomia).slice(0, 5), [produtosFiltrados]);
  const topPromocao = useMemo(() => [...produtosFiltrados].sort((a, b) => b.scorePromocao - a.scorePromocao).slice(0, 5), [produtosFiltrados]);
  const topRisco = useMemo(() => [...produtosFiltrados].sort((a, b) => b.scoreRisco - a.scoreRisco).slice(0, 6), [produtosFiltrados]);

  return (
    <div className="space-y-6 dark:text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-600">
            <BrainCircuit className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">IA gestora de produtos</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Inteligência de Produtos, CMV e Precificação
          </h1>
          <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Esta central forma opinião sobre custo, economia, fornecedor, margem e promoção.
            O objetivo aqui não é cadastrar: é orientar decisões melhores no negócio.
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Sparkles className="mr-2 h-4 w-4" />
          Atualizar leitura estratégica
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Produtos da empresa</p>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Com custo preenchido</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.comPreco}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Com fornecedor ligado</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.comFornecedor}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Itens críticos no radar</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">{stats.criticos}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, categoria, marca ou fornecedor"
              className="pl-9 dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-orange-600" />
              Opiniões prioritárias da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-14 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Lendo produtos, categorias e fornecedores...
              </div>
            ) : erro ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {erro}
              </div>
            ) : (
              opinioes.map((item, idx) => (
                <div key={`${item.titulo}-${idx}`} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge
                      className={
                        item.nivel === "alto"
                          ? "bg-red-600 text-white hover:bg-red-600"
                          : item.nivel === "medio"
                          ? "bg-orange-600 text-white hover:bg-orange-600"
                          : "bg-blue-600 text-white hover:bg-blue-600"
                      }
                    >
                      {item.nivel === "alto" ? "Alta prioridade" : item.nivel === "medio" ? "Média prioridade" : "Monitorar"}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.titulo}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.resumo}</p>
                  <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                    <strong>Impacto:</strong> {item.impacto}
                  </p>
                  <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                    <strong>Ação sugerida:</strong> {item.acao}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-orange-600" />
              Leituras que mais afetam decisão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-semibold">Economia potencial</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Itens com maior espaço para negociação, troca de fornecedor ou revisão de embalagem.
              </p>
              <div className="mt-3 space-y-2">
                {topEconomia.slice(0, 3).map((item) => (
                  <div key={`eco-${item.id}`} className="flex items-center justify-between text-sm">
                    <span>{getProdutoNome(item)}</span>
                    <Badge variant="outline">{item.scoreEconomia}/100</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2 text-blue-600">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-semibold">Vocação promocional</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Itens que podem virar vitrine, combo ou âncora com menor risco relativo de margem.
              </p>
              <div className="mt-3 space-y-2">
                {topPromocao.slice(0, 3).map((item) => (
                  <div key={`promo-${item.id}`} className="flex items-center justify-between text-sm">
                    <span>{getProdutoNome(item)}</span>
                    <Badge variant="outline">{item.scorePromocao}/100</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeDollarSign className="h-4 w-4 text-orange-600" />
              Top economia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topEconomia.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{getProdutoNome(item)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCategoria(item)}</p>
                  </div>
                  <Badge variant="outline">{item.scoreEconomia}/100</Badge>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Custo base: {currency(item.custoBase)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-4 w-4 text-orange-600" />
              Top promoção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPromocao.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{getProdutoNome(item)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCategoria(item)}</p>
                  </div>
                  <Badge variant="outline">{item.scorePromocao}/100</Badge>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Custo base: {currency(item.custoBase)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              Radar de risco de CMV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRisco.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{getProdutoNome(item)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCategoria(item)}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Fornecedor: {item.fornecedor_nome || "não ligado"}</p>
                  </div>
                  <Badge className={item.scoreRisco >= 75 ? "bg-red-600 text-white hover:bg-red-600" : "bg-orange-600 text-white hover:bg-orange-600"}>
                    {item.scoreRisco}/100
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {item.scoreRisco >= 75 ? <AlertTriangle className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  Custo base {currency(item.custoBase)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

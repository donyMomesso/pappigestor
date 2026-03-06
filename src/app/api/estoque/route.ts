import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type EstoquePosicaoRow = {
  estoque_item_id: string;
  empresa_id: string;
  produto_id: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ponto_reposicao: number | null;
  fornecedor_padrao_id: string | null;
  unidade_medida: string | null;
  ativo: boolean;
  observacao: string | null;
  saldo_atual: number;
  custo_medio: number;
  valor_estoque: number;
  abaixo_minimo: boolean;
  abaixo_ponto_reposicao: boolean;
  ultima_movimentacao_em: string | null;
  created_at: string;
  updated_at: string;
};

type ProdutoRow = {
  id: number;
  nome_produto: string;
  categoria_produto: string | null;
  unidade_medida: string | null;
};

type EstoqueResponseItem = {
  id: string;
  produto_id: number;
  produto_nome: string;
  categoria_produto: string | null;
  unidade_medida: string;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ponto_reposicao: number | null;
  custo_medio: number;
  valor_estoque: number;
  abaixo_minimo: boolean;
  abaixo_ponto_reposicao: boolean;
  ultima_movimentacao_em: string | null;
  ativo: boolean;
  observacao: string | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function parseEmpresaId(req: NextRequest): string | null {
  const empresaId =
    req.headers.get("x-empresa-id") ||
    req.headers.get("x-pizzaria-id") ||
    req.nextUrl.searchParams.get("empresa_id");

  return empresaId && empresaId.trim() ? empresaId.trim() : null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    const empresaId = parseEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        { error: "Empresa não informada. Envie x-empresa-id ou x-pizzaria-id no header." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const somenteBaixo =
      req.nextUrl.searchParams.get("somente_baixo") === "true";

    const busca = (req.nextUrl.searchParams.get("busca") || "").trim();

    let estoqueQuery = supabase
      .from("vw_estoque_posicao")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("updated_at", { ascending: false });

    if (somenteBaixo) {
      estoqueQuery = estoqueQuery.eq("abaixo_minimo", true);
    }

    const { data: estoqueRows, error: estoqueError } = await estoqueQuery;

    if (estoqueError) {
      console.error("Erro ao buscar posição de estoque:", estoqueError);
      return NextResponse.json(
        { error: "Erro ao buscar posição de estoque." },
        { status: 500 }
      );
    }

    const posicoes = (estoqueRows || []) as EstoquePosicaoRow[];

    if (posicoes.length === 0) {
      return NextResponse.json([]);
    }

    const produtoIds = [...new Set(posicoes.map((item) => item.produto_id))];

    const { data: produtosRows, error: produtosError } = await supabase
      .from("produtos")
      .select("id, nome_produto, categoria_produto, unidade_medida")
      .eq("empresa_id", empresaId)
      .in("id", produtoIds);

    if (produtosError) {
      console.error("Erro ao buscar produtos do estoque:", produtosError);
      return NextResponse.json(
        { error: "Erro ao buscar dados dos produtos." },
        { status: 500 }
      );
    }

    const produtos = (produtosRows || []) as ProdutoRow[];
    const produtosMap = new Map<number, ProdutoRow>(
      produtos.map((produto) => [produto.id, produto])
    );

    let response: EstoqueResponseItem[] = posicoes.map((item) => {
      const produto = produtosMap.get(item.produto_id);

      return {
        id: item.estoque_item_id,
        produto_id: item.produto_id,
        produto_nome: produto?.nome_produto || `Produto #${item.produto_id}`,
        categoria_produto: produto?.categoria_produto || null,
        unidade_medida:
          item.unidade_medida || produto?.unidade_medida || "un",
        quantidade_atual: toNumber(item.saldo_atual),
        estoque_minimo: toNumber(item.estoque_minimo),
        estoque_maximo:
          item.estoque_maximo === null ? null : toNumber(item.estoque_maximo),
        ponto_reposicao:
          item.ponto_reposicao === null ? null : toNumber(item.ponto_reposicao),
        custo_medio: toNumber(item.custo_medio),
        valor_estoque: toNumber(item.valor_estoque),
        abaixo_minimo: Boolean(item.abaixo_minimo),
        abaixo_ponto_reposicao: Boolean(item.abaixo_ponto_reposicao),
        ultima_movimentacao_em: item.ultima_movimentacao_em,
        ativo: Boolean(item.ativo),
        observacao: item.observacao,
      };
    });

    if (busca) {
      const buscaLower = busca.toLowerCase();
      response = response.filter((item) => {
        return (
          item.produto_nome.toLowerCase().includes(buscaLower) ||
          (item.categoria_produto || "").toLowerCase().includes(buscaLower)
        );
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro interno GET /api/estoque:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar estoque." },
      { status: 500 }
    );
  }
}
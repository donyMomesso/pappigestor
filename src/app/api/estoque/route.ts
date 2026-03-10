import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type EstoquePosicaoRow = {
  estoque_item_id: string;
  empresa_id: string;
  produto_id: string;
  estoque_minimo: number | string;
  estoque_maximo: number | string | null;
  ponto_reposicao: number | string | null;
  fornecedor_padrao_id: string | null;
  unidade_medida: string | null;
  ativo: boolean;
  observacao: string | null;
  saldo_atual: number | string;
  custo_medio: number | string;
  valor_estoque: number | string;
  abaixo_minimo: boolean;
  abaixo_ponto_reposicao: boolean;
  ultima_movimentacao_em: string | null;
  created_at: string;
  updated_at: string;
};

type ProdutoRow = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string | null;
  empresa_id: string | null;
};

type EstoqueResponseItem = {
  id: string;
  produto_id: string;
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

type UsuarioEmpresaRow = {
  empresa_id: string | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSupabaseFromRequest(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        // rota GET não precisa persistir cookies aqui
      },
    },
  });
}

function parseEmpresaId(req: NextRequest): string | null {
  const empresaId =
    req.headers.get("x-empresa-id") ||
    req.headers.get("x-empresa-id") ||
    req.nextUrl.searchParams.get("empresa_id");

  return empresaId && empresaId.trim() ? empresaId.trim() : null;
}

async function resolveEmpresaId(req: NextRequest): Promise<string | null> {
  const fromRequest = parseEmpresaId(req);
  if (fromRequest) return fromRequest;

  const supabaseAuth = getSupabaseFromRequest(req);
  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: usuarioRow } = await supabaseAdmin
    .from("usuarios")
    .select("empresa_id")
    .eq("id", user.id)
    .maybeSingle<UsuarioEmpresaRow>();

  if (usuarioRow?.empresa_id) {
    return usuarioRow.empresa_id;
  }

  const { data: vinculoRow } = await supabaseAdmin
    .from("usuarios_empresa")
    .select("empresa_id")
    .eq("usuario_id", user.id)
    .maybeSingle<UsuarioEmpresaRow>();

  if (vinculoRow?.empresa_id) {
    return vinculoRow.empresa_id;
  }

  return null;
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
    const empresaId = await resolveEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "Empresa não informada. Envie x-empresa-id, ?empresa_id=... ou acesse autenticado com vínculo de empresa.",
        },
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
        {
          error: "Erro ao buscar posição de estoque.",
          details: estoqueError.message,
        },
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
      .select("id, nome, categoria, unidade, empresa_id")
      .in("id", produtoIds);

    if (produtosError) {
      console.error("Erro ao buscar produtos do estoque:", produtosError);
      return NextResponse.json(
        {
          error: "Erro ao buscar dados dos produtos.",
          details: produtosError.message,
        },
        { status: 500 }
      );
    }

    const produtos = (produtosRows || []) as ProdutoRow[];
    const produtosMap = new Map<string, ProdutoRow>(
      produtos.map((produto) => [produto.id, produto])
    );

    let response: EstoqueResponseItem[] = posicoes.map((item) => {
      const produto = produtosMap.get(item.produto_id);

      return {
        id: item.estoque_item_id,
        produto_id: item.produto_id,
        produto_nome: produto?.nome || `Produto ${item.produto_id}`,
        categoria_produto: produto?.categoria || null,
        unidade_medida: item.unidade_medida || produto?.unidade || "un",
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
      {
        error: "Erro interno ao carregar estoque.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

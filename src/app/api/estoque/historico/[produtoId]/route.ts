import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type HistoricoRow = {
  id: string;
  empresa_id: string;
  produto_id: string;
  tipo: string;
  origem: string;
  quantidade: number | string;
  unidade_medida: string | null;
  custo_unitario: number | string | null;
  custo_total: number | string | null;
  referencia_tabela: string | null;
  referencia_id: string | null;
  documento_numero: string | null;
  observacao: string | null;
  justificativa: string | null;
  lote: string | null;
  data_validade: string | null;
  quantidade_caixas: number | null;
  unidades_por_caixa: number | null;
  quantidade_sistema_antes: number | string | null;
  quantidade_real_contada: number | string | null;
  diferenca_inventario: number | string | null;
  usuario_id: string | null;
  created_at: string;
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

function parseEmpresaId(req: NextRequest): string | null {
  const empresaId =
    req.headers.get("x-empresa-id") ||
    req.headers.get("x-empresa-id") ||
    req.nextUrl.searchParams.get("empresa_id");

  return empresaId && empresaId.trim() ? empresaId.trim() : null;
}

function toNumber(value: unknown, fallback: number | null = null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function getQuantidadeAssinada(item: HistoricoRow): number {
  const quantidade = toNumber(item.quantidade, 0) ?? 0;
  const diferencaInventario = toNumber(item.diferenca_inventario, null);

  if (item.tipo === "ajuste_inventario") {
    return diferencaInventario ?? quantidade;
  }

  if (
    item.tipo === "entrada_compra" ||
    item.tipo === "entrada_manual" ||
    item.tipo === "transferencia_entrada"
  ) {
    return quantidade;
  }

  return -quantidade;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ produtoId: string }> }
) {
  try {
    const empresaId = parseEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        {
          error: "Empresa não informada. Envie x-empresa-id, x-empresa-id ou empresa_id.",
        },
        { status: 400 }
      );
    }

    const { produtoId } = await context.params;

    if (!produtoId?.trim()) {
      return NextResponse.json(
        { error: "produtoId é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("estoque_movimentacoes")
      .select(`
        id,
        empresa_id,
        produto_id,
        tipo,
        origem,
        quantidade,
        unidade_medida,
        custo_unitario,
        custo_total,
        referencia_tabela,
        referencia_id,
        documento_numero,
        observacao,
        justificativa,
        lote,
        data_validade,
        quantidade_caixas,
        unidades_por_caixa,
        quantidade_sistema_antes,
        quantidade_real_contada,
        diferenca_inventario,
        usuario_id,
        created_at
      `)
      .eq("empresa_id", empresaId)
      .eq("produto_id", produtoId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico de estoque:", error);
      return NextResponse.json(
        {
          error: "Erro ao buscar histórico do item.",
          details: error.message,
          hint: error.hint ?? null,
        },
        { status: 500 }
      );
    }

    const historico = ((data || []) as HistoricoRow[]).map((item) => ({
      ...item,
      quantidade: toNumber(item.quantidade, 0),
      custo_unitario: toNumber(item.custo_unitario, null),
      custo_total: toNumber(item.custo_total, null),
      quantidade_sistema_antes: toNumber(item.quantidade_sistema_antes, null),
      quantidade_real_contada: toNumber(item.quantidade_real_contada, null),
      diferenca_inventario: toNumber(item.diferenca_inventario, null),
      quantidade_assinada: getQuantidadeAssinada(item),
    }));

    return NextResponse.json(historico);
  } catch (error) {
    console.error("Erro interno GET /api/estoque/historico/[produtoId]:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar histórico do estoque.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
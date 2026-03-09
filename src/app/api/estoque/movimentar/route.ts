import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type TipoMovimentacao =
  | "entrada_compra"
  | "entrada_manual"
  | "saida_producao"
  | "ajuste_inventario"
  | "perda"
  | "transferencia_entrada"
  | "transferencia_saida";

type OrigemMovimentacao =
  | "compra"
  | "recebimento"
  | "inventario"
  | "producao"
  | "manual"
  | "transferencia"
  | "integracao";

type MovimentarBody = {
  produto_id?: string;
  tipo?: TipoMovimentacao;
  origem?: OrigemMovimentacao;
  quantidade?: number | string;
  unidade_medida?: string | null;
  custo_unitario?: number | string | null;
  referencia_tabela?: string | null;
  referencia_id?: string | number | null;
  documento_numero?: string | null;
  observacao?: string | null;
  justificativa?: string | null;
  lote?: string | null;
  data_validade?: string | null;
  quantidade_caixas?: number | string | null;
  unidades_por_caixa?: number | string | null;
  usuario_id?: string | null;
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toInteger(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Number.isInteger(parsed) ? parsed : Math.trunc(parsed);
}

const TIPOS_VALIDOS: TipoMovimentacao[] = [
  "entrada_compra",
  "entrada_manual",
  "saida_producao",
  "ajuste_inventario",
  "perda",
  "transferencia_entrada",
  "transferencia_saida",
];

const ORIGENS_VALIDAS: OrigemMovimentacao[] = [
  "compra",
  "recebimento",
  "inventario",
  "producao",
  "manual",
  "transferencia",
  "integracao",
];

export async function POST(req: NextRequest) {
  try {
    const empresaId = parseEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        { error: "Empresa não informada. Envie x-empresa-id ou x-empresa-id no header." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as MovimentarBody;

    const produtoId = body?.produto_id?.trim();
    const tipo = body?.tipo;
    const origem = body?.origem ?? "manual";
    const quantidade = toNumber(body?.quantidade);
    const unidadeMedida = body?.unidade_medida?.trim() || null;
    const custoUnitario = toNumber(body?.custo_unitario);
    const referenciaTabela = body?.referencia_tabela?.trim() || null;
    const referenciaId =
      body?.referencia_id == null ? null : String(body.referencia_id).trim() || null;
    const documentoNumero = body?.documento_numero?.trim() || null;
    const observacao = body?.observacao?.trim() || null;
    const justificativa = body?.justificativa?.trim() || null;
    const lote = body?.lote?.trim() || null;
    const dataValidade = body?.data_validade?.trim() || null;
    const quantidadeCaixas = toInteger(body?.quantidade_caixas);
    const unidadesPorCaixa = toInteger(body?.unidades_por_caixa);
    const usuarioId = body?.usuario_id?.trim() || null;

    if (!produtoId) {
      return NextResponse.json({ error: "produto_id é obrigatório." }, { status: 400 });
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ error: "tipo de movimentação inválido." }, { status: 400 });
    }

    if (!origem || !ORIGENS_VALIDAS.includes(origem)) {
      return NextResponse.json({ error: "origem da movimentação inválida." }, { status: 400 });
    }

    if (tipo === "ajuste_inventario") {
      return NextResponse.json(
        { error: "Use /api/estoque/ajustar para ajuste de inventário." },
        { status: 400 }
      );
    }

    if (quantidade === null || quantidade <= 0) {
      return NextResponse.json({ error: "quantidade inválida." }, { status: 400 });
    }

    if (quantidadeCaixas !== null && quantidadeCaixas < 0) {
      return NextResponse.json({ error: "quantidade_caixas inválida." }, { status: 400 });
    }

    if (unidadesPorCaixa !== null && unidadesPorCaixa <= 0) {
      return NextResponse.json({ error: "unidades_por_caixa inválida." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("fn_registrar_movimentacao_estoque", {
      p_empresa_id: empresaId,
      p_produto_id: produtoId,
      p_tipo: tipo,
      p_origem: origem,
      p_quantidade: quantidade,
      p_unidade_medida: unidadeMedida,
      p_custo_unitario: custoUnitario,
      p_referencia_tabela: referenciaTabela,
      p_referencia_id: referenciaId,
      p_documento_numero: documentoNumero,
      p_observacao: observacao,
      p_justificativa: justificativa,
      p_lote: lote,
      p_data_validade: dataValidade,
      p_quantidade_caixas: quantidadeCaixas,
      p_unidades_por_caixa: unidadesPorCaixa,
      p_usuario_id: usuarioId,
    });

    if (error) {
      console.error("Erro ao registrar movimentação:", error);

      const message = error.message || "Erro ao registrar movimentação.";

      if (
        message.includes("Estoque insuficiente") ||
        message.includes("Quantidade inválida")
      ) {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      return NextResponse.json(
        {
          error: "Erro ao registrar movimentação.",
          details: error.message,
          hint: error.hint ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movimentacao_id: data,
      message: "Movimentação registrada com sucesso.",
    });
  } catch (error) {
    console.error("Erro interno POST /api/estoque/movimentar:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao registrar movimentação.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
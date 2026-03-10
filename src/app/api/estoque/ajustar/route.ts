import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AjustarBody = {
  produto_id?: string;
  quantidade_real?: number;
  observacao?: string;
  justificativa?: string;
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

export async function POST(req: NextRequest) {
  try {
    const empresaId = parseEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        { error: "Empresa não informada. Envie x-empresa-id ou x-empresa-id no header." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as AjustarBody;

    const produtoId = body?.produto_id?.trim();
    const quantidadeReal = toNumber(body?.quantidade_real);
    const observacao = body?.observacao?.trim() || "Ajuste de inventário";
    const justificativa = body?.justificativa?.trim() || null;
    const usuarioId = body?.usuario_id?.trim() || null;

    if (!produtoId) {
      return NextResponse.json(
        { error: "produto_id é obrigatório." },
        { status: 400 }
      );
    }

    if (quantidadeReal === null || quantidadeReal < 0) {
      return NextResponse.json(
        { error: "quantidade_real inválida." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("fn_ajustar_inventario_estoque", {
      p_empresa_id: empresaId,
      p_produto_id: produtoId,
      p_quantidade_real: quantidadeReal,
      p_observacao: observacao,
      p_justificativa: justificativa,
      p_usuario_id: usuarioId,
    });

    if (error) {
      console.error("Erro ao ajustar inventário:", error);

      const message = error.message || "Erro ao ajustar inventário.";

      if (
        message.includes("Não há divergência entre sistema e contagem física.") ||
        message.includes("Quantidade real inválida.")
      ) {
        return NextResponse.json(
          { error: message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao ajustar inventário.",
          details: error.message,
          hint: error.hint ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movimentacao_id: data,
      message: "Ajuste de inventário registrado com sucesso.",
    });
  } catch (error) {
    console.error("Erro interno POST /api/estoque/ajustar:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao ajustar inventário.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

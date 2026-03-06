import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado");
  }

  return createClient(url, key);
}

function getEmpresaId(req: NextRequest): string | null {
  return req.headers.get("x-empresa-id");
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;

    if (!empresaId) {
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID não informado" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if ("fornecedor" in body) updateData.fornecedor = body.fornecedor;
    if ("categoria" in body) updateData.categoria = body.categoria;
    if ("valor_previsto" in body) updateData.valor_previsto = Number(body.valor_previsto);
    if ("is_boleto_recebido" in body)
      updateData.is_boleto_recebido = Boolean(body.is_boleto_recebido);
    if ("valor_real" in body)
      updateData.valor_real =
        body.valor_real === null || body.valor_real === undefined
          ? null
          : Number(body.valor_real);
    if ("vencimento_real" in body) updateData.vencimento_real = body.vencimento_real || null;
    if ("data_pagamento" in body) updateData.data_pagamento = body.data_pagamento || null;
    if ("anexo_url" in body) updateData.anexo_url = body.anexo_url || null;
    if ("comprovante_url" in body)
      updateData.comprovante_url = body.comprovante_url || null;
    if ("observacao" in body) updateData.observacao = body.observacao || null;

    if ("data_pagamento" in body) {
      updateData.status_pagamento = body.data_pagamento ? "pago" : "pendente";
    }

    updateData.updated_at = new Date().toISOString();

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("lancamentos")
      .update(updateData)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro PATCH /api/lancamentos/[id]:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar lançamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;

    if (!empresaId) {
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID não informado" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("lancamentos")
      .delete()
      .eq("id", id)
      .eq("empresa_id", empresaId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro DELETE /api/lancamentos/[id]:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir lançamento" },
      { status: 500 }
    );
  }
}

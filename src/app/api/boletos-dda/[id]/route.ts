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
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const body = await req.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ("fornecedor_nome" in body) updateData.fornecedor_nome = body.fornecedor_nome;
    if ("valor" in body) updateData.valor = Number(body.valor);
    if ("vencimento" in body) updateData.vencimento = body.vencimento;
    if ("codigo_barras" in body) updateData.codigo_barras = body.codigo_barras || null;
    if ("linha_digitavel" in body) updateData.linha_digitavel = body.linha_digitavel || null;
    if ("status_pagamento" in body) updateData.status_pagamento = body.status_pagamento;
    if ("data_pagamento" in body) updateData.data_pagamento = body.data_pagamento || null;

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("boletos_dda")
      .update(updateData)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro PATCH /api/boletos-dda/[id]:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar boleto DDA" },
      { status: 500 }
    );
  }
}
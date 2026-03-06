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

    if ("pluggy_item_id" in body) updateData.pluggy_item_id = body.pluggy_item_id || null;
    if ("banco_nome" in body) updateData.banco_nome = body.banco_nome;
    if ("banco_codigo" in body) updateData.banco_codigo = body.banco_codigo || null;
    if ("banco_logo_url" in body) updateData.banco_logo_url = body.banco_logo_url || null;
    if ("status" in body) updateData.status = body.status || "pendente";
    if ("ultima_sincronizacao" in body) {
      updateData.ultima_sincronizacao = body.ultima_sincronizacao || null;
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("conexoes_bancarias")
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
    console.error("Erro PATCH /api/conexoes-bancarias/[id]:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar conexão bancária" },
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
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("conexoes_bancarias")
      .delete()
      .eq("id", id)
      .eq("empresa_id", empresaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro DELETE /api/conexoes-bancarias/[id]:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir conexão bancária" },
      { status: 500 }
    );
  }
}
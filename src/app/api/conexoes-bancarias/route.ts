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

export async function GET(req: NextRequest) {
  try {
    const empresaId = getEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("conexoes_bancarias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erro GET /api/conexoes-bancarias:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar conexões bancárias" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = getEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const body = await req.json();

    if (!body.banco_nome) {
      return NextResponse.json({ error: "banco_nome é obrigatório" }, { status: 400 });
    }

    const supabase = getSupabase();

    const payload = {
      empresa_id: empresaId,
      pluggy_item_id: body.pluggy_item_id || null,
      banco_nome: String(body.banco_nome),
      banco_codigo: body.banco_codigo || null,
      banco_logo_url: body.banco_logo_url || null,
      status: body.status || "pendente",
      ultima_sincronizacao: body.ultima_sincronizacao || null,
    };

    const { data, error } = await supabase
      .from("conexoes_bancarias")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro POST /api/conexoes-bancarias:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conexão bancária" },
      { status: 500 }
    );
  }
}
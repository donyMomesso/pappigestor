import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const empresaId = getEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const body = await req.json();

    if (!body.connectorName) {
      return NextResponse.json({ error: "Banco não informado" }, { status: 400 });
    }

    const supabase = getSupabase();

    const pluggyItemId = `manual_${crypto.randomUUID()}`;

    const { data: existing } = await supabase
      .from("conexoes_bancarias")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("banco_nome", body.connectorName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Este banco já está conectado para esta empresa" },
        { status: 409 }
      );
    }

    const payload = {
      empresa_id: empresaId,
      pluggy_item_id: pluggyItemId,
      banco_nome: String(body.connectorName),
      banco_codigo: body.bancoCodigo ? String(body.bancoCodigo) : null,
      banco_logo_url: body.connectorLogo || null,
      status: "ativo",
      ultima_sincronizacao: null,
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
    console.error("Erro POST /api/pluggy/conexao:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar conexão bancária" },
      { status: 500 }
    );
  }
}
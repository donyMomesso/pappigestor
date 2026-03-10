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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const supabase = getSupabase();

    let query = supabase
      .from("boletos_dda")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("vencimento", { ascending: true });

    if (status && status !== "todos") {
      query = query.eq("status_pagamento", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erro GET /api/boletos-dda:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar boletos DDA" },
      { status: 500 }
    );
  }
}

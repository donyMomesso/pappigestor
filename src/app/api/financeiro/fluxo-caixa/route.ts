import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createClient(url!, key!);
}

function getEmpresaId(req: NextRequest) {
  return req.headers.get("x-empresa-id");
}

export async function GET(req: NextRequest) {
  try {
    const empresaId = getEmpresaId(req);

    const supabase = getSupabase();

    const { data } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("vencimento_real");

    const fluxo: any = {};

    data?.forEach((l) => {
      const dataKey = l.vencimento_real;

      if (!fluxo[dataKey]) {
        fluxo[dataKey] = {
          data: dataKey,
          entradas: 0,
          saidas: 0,
        };
      }

      if (l.status_pagamento === "pago") {
        fluxo[dataKey].saidas += Number(l.valor_real || 0);
      } else {
        fluxo[dataKey].saidas += Number(l.valor_previsto || 0);
      }
    });

    return NextResponse.json(Object.values(fluxo));
  } catch {
    return NextResponse.json(
      { error: "Erro ao gerar fluxo de caixa" },
      { status: 500 }
    );
  }
}

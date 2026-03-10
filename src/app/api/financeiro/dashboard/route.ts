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

    if (!empresaId) {
      return NextResponse.json({ error: "empresa_id não enviado" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: lancamentos } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId);

    const hoje = new Date();

    let pagarHoje = 0;
    let pagarAtrasado = 0;
    let totalPendente = 0;
    let totalPago = 0;

    lancamentos?.forEach((l) => {
      if (l.status_pagamento === "pendente") {
        totalPendente += Number(l.valor_previsto || 0);

        const venc = new Date(l.vencimento_real);

        if (venc < hoje) {
          pagarAtrasado += Number(l.valor_previsto);
        }

        if (venc.toDateString() === hoje.toDateString()) {
          pagarHoje += Number(l.valor_previsto);
        }
      }

      if (l.status_pagamento === "pago") {
        totalPago += Number(l.valor_real || 0);
      }
    });

    return NextResponse.json({
      pagarHoje,
      pagarAtrasado,
      totalPendente,
      totalPago,
      totalLancamentos: lancamentos?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao gerar dashboard financeiro" },
      { status: 500 }
    );
  }
}

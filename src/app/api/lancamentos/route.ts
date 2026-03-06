import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StatusPagamento = "pendente" | "pago";

interface LancamentoInsert {
  empresa_id: string;
  data_pedido: string;
  fornecedor: string;
  categoria: string;
  valor_previsto: number;
  is_boleto_recebido: boolean;
  valor_real: number | null;
  vencimento_real: string | null;
  status_pagamento: StatusPagamento;
  data_pagamento: string | null;
  anexo_url: string | null;
  comprovante_url: string | null;
  observacao: string | null;
  is_manual: boolean;
}

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
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("data_pagamento", { ascending: false, nullsFirst: false })
      .order("vencimento_real", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erro GET /api/lancamentos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar lançamentos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = getEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.fornecedor || !body.categoria || body.valor_previsto == null) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const valorPrevisto = Number(body.valor_previsto);
    const valorReal =
      body.valor_real === null || body.valor_real === undefined
        ? null
        : Number(body.valor_real);

    const dataPagamento = body.data_pagamento || null;

    const payload: LancamentoInsert = {
      empresa_id: empresaId,
      data_pedido: body.data_pedido || new Date().toISOString().split("T")[0],
      fornecedor: String(body.fornecedor),
      categoria: String(body.categoria),
      valor_previsto: Number.isNaN(valorPrevisto) ? 0 : valorPrevisto,
      is_boleto_recebido: Boolean(body.is_boleto_recebido),
      valor_real: Number.isNaN(valorReal as number) ? null : valorReal,
      vencimento_real: body.vencimento_real || null,
      status_pagamento: dataPagamento ? "pago" : "pendente",
      data_pagamento: dataPagamento,
      anexo_url: body.anexo_url || null,
      comprovante_url: body.comprovante_url || null,
      observacao: body.observacao || null,
      is_manual: Boolean(body.is_manual),
    };

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("lancamentos")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro POST /api/lancamentos:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar lançamento" },
      { status: 500 }
    );
  }
}
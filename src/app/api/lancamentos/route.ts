import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveEmpresaId } from "@/lib/pappi-server";

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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const categoria = req.nextUrl.searchParams.get("categoria")?.trim();
    const limit = Number(req.nextUrl.searchParams.get("limit") || 0);
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("data_pagamento", { ascending: false, nullsFirst: false })
      .order("vencimento_real", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (categoria) {
      query = query.eq("categoria", categoria);
    }

    if (Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erro GET /api/lancamentos:", error);
    return NextResponse.json({ error: "Erro interno ao buscar lançamentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = (await resolveEmpresaId(req)) || "";
    const contentType = req.headers.get("content-type") || "";

    let body: any = {};
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      body = {
        empresa_id: String(form.get("empresa_id") || empresaId || "").trim(),
        data_pedido: String(form.get("data_pedido") || ""),
        fornecedor: String(form.get("fornecedor") || "").trim(),
        categoria: String(form.get("categoria") || "").trim(),
        valor_previsto: String(form.get("valor_previsto") || "0"),
        valor_real: form.get("valor_real"),
        vencimento_real: form.get("vencimento_real"),
        data_pagamento: form.get("data_pagamento"),
        observacao: form.get("observacao"),
        is_manual: true,
        is_boleto_recebido: String(form.get("is_boleto_recebido") || "false") === "true",
        anexo_url: null,
        comprovante_url: null,
        itens: form.get("itens") ? JSON.parse(String(form.get("itens"))) : [],
      };
    } else {
      body = await req.json();
      body.empresa_id = body?.empresa_id || empresaId || "";
    }

    const finalEmpresaId = String(body?.empresa_id || "").trim();

    if (!finalEmpresaId) {
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    if (!body.fornecedor || !body.categoria || body.valor_previsto == null) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const valorPrevisto = toNumber(body.valor_previsto, 0);
    const valorReal =
      body.valor_real === null || body.valor_real === undefined || body.valor_real === ""
        ? null
        : toNumber(body.valor_real, 0);

    const dataPagamento = body.data_pagamento || null;

    const payload: LancamentoInsert = {
      empresa_id: finalEmpresaId,
      data_pedido: body.data_pedido || new Date().toISOString().split("T")[0],
      fornecedor: String(body.fornecedor),
      categoria: String(body.categoria),
      valor_previsto: valorPrevisto,
      is_boleto_recebido: Boolean(body.is_boleto_recebido),
      valor_real,
      vencimento_real: body.vencimento_real || null,
      status_pagamento: dataPagamento ? "pago" : "pendente",
      data_pagamento: dataPagamento,
      anexo_url: body.anexo_url || null,
      comprovante_url: body.comprovante_url || null,
      observacao: body.observacao || null,
      is_manual: body.is_manual !== false,
    };

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.from("lancamentos").insert(payload).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const itens = Array.isArray(body?.itens) ? body.itens : [];
    if (itens.length > 0) {
      await supabase.from("lancamento_itens").insert(
        itens.map((item: any) => ({
          empresa_id: finalEmpresaId,
          lancamento_id: data.id,
          produto: String(item.produto || item.nome || "").trim(),
          quantidade_pedida: Number(item.quantidade_pedida ?? item.quantidade ?? 0) || 0,
          unidade: item.unidade ? String(item.unidade) : "un",
          valor_unitario: Number(item.valor_unitario ?? 0) || 0,
        }))
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro POST /api/lancamentos:", error);
    return NextResponse.json({ error: "Erro interno ao criar lançamento" }, { status: 500 });
  }
}

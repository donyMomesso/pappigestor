import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getEmpresa(req: NextRequest) {
  return req.headers.get("x-empresa-id");
}

export async function GET(req: NextRequest) {
  const empresa = getEmpresa(req);

  const db = supabase();

  const { data: vendas } = await db
    .from("vendas")
    .select("*")
    .eq("empresa_id", empresa);

  const { data: produtos } = await db
    .from("produtos")
    .select("*")
    .eq("empresa_id", empresa);

  let faturamento = 0;
  let custoTotal = 0;

  vendas?.forEach((v) => {
    faturamento += Number(v.valor_total);

    const produto = produtos?.find((p) => p.id === v.produto_id);

    if (produto) {
      custoTotal += Number(produto.custo_unitario) * Number(v.quantidade);
    }
  });

  const lucro = faturamento - custoTotal;

  const cmv = faturamento > 0 ? (custoTotal / faturamento) * 100 : 0;

  return NextResponse.json({
    faturamento,
    custoTotal,
    lucro,
    cmv,
  });
}

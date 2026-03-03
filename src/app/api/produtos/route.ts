import { NextResponse } from "next/server";
import { createProduto, getDb, getPizzariaId } from "../_db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    return NextResponse.json(db.produtos);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const body = await req.json();
    if (!body?.nome_produto) return NextResponse.json({ error: "nome_produto obrigatório" }, { status: 400 });
    const p = createProduto(db, {
      nome_produto: String(body.nome_produto),
      categoria_produto: String(body.categoria_produto || "Insumos"),
      unidade_medida: String(body.unidade_medida || "un").toLowerCase(),
      fornecedor_preferencial_id: body.fornecedor_preferencial_id ? String(body.fornecedor_preferencial_id) : null,
    });
    return NextResponse.json(p);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

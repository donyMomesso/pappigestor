import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../../_db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const body = await req.json();

    const principalId = String(body?.produto_principal_id || "");
    const duplicadoId = String(body?.produto_duplicado_id || "");

    if (!principalId || !duplicadoId) {
      return NextResponse.json({ error: "IDs obrigatórios" }, { status: 400 });
    }

    db.itens = db.itens.map((item) =>
      item.produto_id === duplicadoId ? { ...item, produto_id: principalId } : item
    );

    db.estoque = db.estoque.map((item) =>
      item.produto_id === duplicadoId ? { ...item, produto_id: principalId } : item
    );

    db.produtos = db.produtos.filter((produto) => produto.id !== duplicadoId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

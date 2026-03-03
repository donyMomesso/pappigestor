import { NextResponse } from "next/server";
import { createItem, getDb, getPizzariaId } from "../_db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const enriched = db.itens.map((i) => {
      const p = db.produtos.find((x) => x.id === i.produto_id);
      return {
        ...i,
        produto_nome: p?.nome_produto || "(Produto)",
        unidade_medida: p?.unidade_medida || "un",
        solicitante_nome: "Gestor",
      };
    });
    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const body = await req.json();
    const produtoId = String(body?.produto_id || "");
    const qtd = Number(body?.quantidade_solicitada || 1);
    if (!produtoId) return NextResponse.json({ error: "produto_id obrigatório" }, { status: 400 });
    if (!db.produtos.some((p) => p.id === produtoId)) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    const item = createItem(db, produtoId, Number.isFinite(qtd) && qtd > 0 ? qtd : 1);
    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

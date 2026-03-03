import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../_db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const enriched = db.estoque.map((e) => {
      const p = db.produtos.find((x) => x.id === e.produto_id);
      return {
        ...e,
        produto_nome: p?.nome_produto || "(Produto)",
        unidade_medida: p?.unidade_medida || "un",
      };
    });
    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

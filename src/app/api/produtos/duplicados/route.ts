import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../../_db";
import { normalizarTexto } from "@/data/produtos-food-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);

    const grupos = new Map<string, typeof db.produtos>();

    for (const produto of db.produtos) {
      const chave = normalizarTexto(produto.nome_produto);
      const lista = grupos.get(chave) || [];
      lista.push(produto);
      grupos.set(chave, lista);
    }

    const duplicados = Array.from(grupos.entries())
      .filter(([, produtos]) => produtos.length > 1)
      .map(([nome_normalizado, produtos]) => ({ nome_normalizado, produtos }));

    return NextResponse.json(duplicados);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../../_db";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const id = ctx.params.id;
    const body = await req.json();
    const item = db.itens.find((i) => i.id === id);
    if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    if (typeof body.status_solicitacao === "string") {
      const s = body.status_solicitacao;
      if (["pendente", "em_cotacao", "aprovado", "cancelado"].includes(s)) {
        // @ts-expect-error narrow
        item.status_solicitacao = s;
      }
    }

    if (typeof body.quantidade_solicitada !== "undefined") {
      const qtd = Number(body.quantidade_solicitada);
      if (Number.isFinite(qtd) && qtd > 0) item.quantidade_solicitada = qtd;
    }

    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const id = ctx.params.id;
    const idx = db.itens.findIndex((i) => i.id === id);
    if (idx === -1) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    db.itens.splice(idx, 1);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

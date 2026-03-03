import { NextResponse, type NextRequest } from "next/server";
import { getDb, getPizzariaId } from "../../_db";

export const runtime = "nodejs";

type StatusSolicitacao = "pendente" | "em_cotacao" | "aprovado" | "cancelado";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    const pId = getPizzariaId(new Headers(request.headers));
    const db = getDb(pId);

    const body = await request.json();

    const item = db.itens.find((i: any) => i.id === id);
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (typeof body?.status_solicitacao === "string") {
      const s = body.status_solicitacao as StatusSolicitacao;
      if (["pendente", "em_cotacao", "aprovado", "cancelado"].includes(s)) {
        item.status_solicitacao = s;
      }
    }

    if (typeof body?.quantidade_solicitada !== "undefined") {
      const qtd = Number(body.quantidade_solicitada);
      if (Number.isFinite(qtd) && qtd > 0) item.quantidade_solicitada = qtd;
    }

    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    const pId = getPizzariaId(new Headers(request.headers));
    const db = getDb(pId);

    const idx = db.itens.findIndex((i: any) => i.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    db.itens.splice(idx, 1);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}
import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../../_db";

export const runtime = "nodejs";

type ItemListaDb = {
  id: string | number;
  status_solicitacao?: string;
  data_baixa?: string | null;
};

export async function POST(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const body = await req.json();
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id))
      : [];

    if (!ids.length) {
      return NextResponse.json(
        { error: "ids é obrigatório" },
        { status: 400 }
      );
    }

    let atualizados = 0;

    for (const id of ids) {
      const item = db.itens.find(
        (i: unknown) => String((i as { id?: string | number })?.id) === id
      ) as ItemListaDb | undefined;

      if (!item) continue;

      item.status_solicitacao = "aprovado";
      item.data_baixa = new Date().toISOString();
      atualizados += 1;
    }

    return NextResponse.json({ ok: true, atualizados });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
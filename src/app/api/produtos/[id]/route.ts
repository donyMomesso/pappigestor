import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../../_db";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    const body = await req.json();

    const produto = db.produtos.find((item) => item.id === id);
    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    Object.assign(produto, {
      ...body,
      preco_referencia: body?.preco_referencia != null ? Number(body.preco_referencia) : produto.preco_referencia,
      ultimo_preco_pago: body?.ultimo_preco_pago != null ? Number(body.ultimo_preco_pago) : produto.ultimo_preco_pago,
    });

    return NextResponse.json(produto);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);

    db.produtos = db.produtos.filter((item) => item.id !== id);
    db.estoque = db.estoque.filter((item) => item.produto_id !== id);
    db.itens = db.itens.filter((item) => item.produto_id !== id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

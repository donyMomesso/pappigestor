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

    const nome = String(body?.nome_produto || "").trim();
    if (!nome) {
      return NextResponse.json({ error: "nome_produto obrigatório" }, { status: 400 });
    }

    const produtoExistente = db.produtos.find(
      (produto) => produto.nome_produto.toLowerCase() === nome.toLowerCase()
    );

    if (produtoExistente) {
      return NextResponse.json({ error: "Produto já existe", produto: produtoExistente }, { status: 409 });
    }

    const produto = createProduto(db, {
      nome_produto: nome,
      categoria_produto: String(body?.categoria_produto || "Outros"),
      unidade_medida: String(body?.unidade_medida || "un"),
      fornecedor_preferencial_id: body?.fornecedor_preferencial_id ? String(body.fornecedor_preferencial_id) : null,
      codigo_barras: body?.codigo_barras ? String(body.codigo_barras) : null,
      marca: body?.marca ? String(body.marca) : null,
      descricao: body?.descricao ? String(body.descricao) : null,
      peso_embalagem: body?.peso_embalagem ? String(body.peso_embalagem) : null,
      preco_referencia: body?.preco_referencia != null ? Number(body.preco_referencia) : null,
      catalogo_base_id: body?.catalogo_base_id ? String(body.catalogo_base_id) : null,
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

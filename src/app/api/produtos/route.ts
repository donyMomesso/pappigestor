import { NextRequest, NextResponse } from "next/server";
import { createProduto, getDb } from "../_db";
import { getSupabaseAdmin, normalizeId, resolveEmpresaId, trySelectByEmpresa } from "@/lib/pappi-server";

export const runtime = "nodejs";

function normalizeProduto(row: any) {
  return {
    ...row,
    id: normalizeId(row.id),
    nome_produto: row.nome_produto ?? row.nome ?? row.descricao ?? "",
    categoria_produto: row.categoria_produto ?? row.categoria ?? "Outros",
    unidade_medida: row.unidade_medida ?? row.unidade ?? "un",
    fornecedor_preferencial_id: row.fornecedor_preferencial_id ?? row.fornecedor_padrao_id ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const result = await trySelectByEmpresa("produtos", "*", empresaId);
    if (!result.error) {
      return NextResponse.json((result.data || []).map(normalizeProduto));
    }

    const db = getDb(empresaId);
    return NextResponse.json(db.produtos.map(normalizeProduto));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const body = await req.json();
    const nome = String(body?.nome_produto || body?.nome || "").trim();
    if (!nome) {
      return NextResponse.json({ error: "nome_produto obrigatório" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const payload: Record<string, any> = {
      empresa_id: empresaId,
      nome,
      nome_produto: nome,
      categoria: String(body?.categoria_produto || body?.categoria || "Outros"),
      categoria_produto: String(body?.categoria_produto || body?.categoria || "Outros"),
      unidade: String(body?.unidade_medida || body?.unidade || "un"),
      unidade_medida: String(body?.unidade_medida || body?.unidade || "un"),
      fornecedor_preferencial_id: body?.fornecedor_preferencial_id ? normalizeId(body.fornecedor_preferencial_id) : null,
      codigo_barras: body?.codigo_barras ? String(body.codigo_barras) : null,
      marca: body?.marca ? String(body.marca) : null,
      descricao: body?.descricao ? String(body.descricao) : null,
      peso_embalagem: body?.peso_embalagem ? String(body.peso_embalagem) : null,
      preco_referencia: body?.preco_referencia != null ? Number(body.preco_referencia) : null,
      catalogo_base_id: body?.catalogo_base_id ? String(body.catalogo_base_id) : null,
    };

    const { data, error } = await supabase.from("produtos").insert(payload).select("*").single();
    if (!error) {
      return NextResponse.json(normalizeProduto(data), { status: 201 });
    }

    const db = getDb(empresaId);
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

    return NextResponse.json(normalizeProduto(produto), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

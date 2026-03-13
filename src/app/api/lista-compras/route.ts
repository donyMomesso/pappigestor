import { NextRequest, NextResponse } from "next/server";
import { createItem, getDb } from "../_db";
import { getSupabaseAdmin, normalizeId, resolveEmpresaId, toNumber, trySelectByEmpresa } from "@/lib/pappi-server";

export const runtime = "nodejs";

type ProdutoRow = Record<string, any>;
type ItemRow = Record<string, any>;

function normalizeProduto(row: ProdutoRow) {
  return {
    id: normalizeId(row.id),
    nome_produto: row.nome_produto ?? row.nome ?? row.descricao ?? "(Produto)",
    unidade_medida: row.unidade_medida ?? row.unidade ?? "un",
  };
}

function normalizeItem(row: ItemRow, produto?: ProdutoRow) {
  const p = produto ? normalizeProduto(produto) : null;
  return {
    id: normalizeId(row.id),
    produto_id: normalizeId(row.produto_id ?? row.id_produto ?? ""),
    quantidade_solicitada: toNumber(row.quantidade_solicitada ?? row.quantidade ?? row.qtd ?? 1, 1),
    status_solicitacao: String(row.status_solicitacao ?? row.status ?? "pendente"),
    data_solicitacao: row.data_solicitacao ?? row.created_at ?? new Date().toISOString(),
    usuario_solicitante_id: row.usuario_solicitante_id ?? row.usuario_id ?? null,
    observacao: row.observacao ?? null,
    produto_nome: p?.nome_produto ?? row.produto_nome ?? row.produto ?? "(Produto)",
    unidade_medida: p?.unidade_medida ?? row.unidade_medida ?? row.unidade ?? "un",
    solicitante_nome: row.solicitante_nome ?? "Gestor",
  };
}

export async function GET(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const statusFilter = (req.nextUrl.searchParams.get("status") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const itemsResult = await trySelectByEmpresa("lista_compras", "*", empresaId);

    if (!itemsResult.error) {
      const rawItems = (itemsResult.data || []) as ItemRow[];
      const produtoIds = [...new Set(rawItems.map((item) => item.produto_id).filter(Boolean))];
      let produtosMap = new Map<string, ProdutoRow>();

      if (produtoIds.length > 0) {
        const produtosResult = await trySelectByEmpresa("produtos", "*", empresaId);
        if (!produtosResult.error) {
          produtosMap = new Map(
            ((produtosResult.data || []) as ProdutoRow[])
              .filter((row) => produtoIds.some((id) => String(id) === String(row.id)))
              .map((row) => [String(row.id), row])
          );
        }
      }

      let enriched = rawItems.map((item) => normalizeItem(item, produtosMap.get(String(item.produto_id))));
      if (statusFilter.length > 0) {
        enriched = enriched.filter((item) => statusFilter.includes(String(item.status_solicitacao)));
      }

      enriched.sort((a, b) => String(b.data_solicitacao).localeCompare(String(a.data_solicitacao)));
      return NextResponse.json(enriched);
    }

    const db = getDb(empresaId);
    let enriched = db.itens.map((i) => {
      const p = db.produtos.find((x) => x.id === i.produto_id);
      return {
        ...i,
        id: normalizeId(i.id),
        produto_id: normalizeId(i.produto_id),
        produto_nome: p?.nome_produto || "(Produto)",
        unidade_medida: p?.unidade_medida || "un",
        solicitante_nome: "Gestor",
      };
    });

    if (statusFilter.length > 0) {
      enriched = enriched.filter((item) => statusFilter.includes(String(item.status_solicitacao)));
    }

    return NextResponse.json(enriched);
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
    const produtoId = String(body?.produto_id || "").trim();
    const qtd = toNumber(body?.quantidade_solicitada, 1);
    const observacao = body?.observacao ? String(body.observacao) : null;

    if (!produtoId) {
      return NextResponse.json({ error: "produto_id obrigatório" }, { status: 400 });
    }

    const produtosResult = await trySelectByEmpresa("produtos", "*", empresaId);
    if (!produtosResult.error) {
      const produto = (produtosResult.data || []).find((p: any) => String(p.id) === produtoId);
      if (!produto) {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
      }

      const payload = {
        empresa_id: empresaId,
        produto_id: normalizeId(produtoId),
        quantidade_solicitada: qtd > 0 ? qtd : 1,
        status_solicitacao: String(body?.status_solicitacao || "pendente"),
        observacao,
        usuario_solicitante_id: body?.usuario_solicitante_id || null,
        data_solicitacao: new Date().toISOString(),
      };

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("lista_compras").insert(payload).select("*").single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(normalizeItem(data, produto), { status: 201 });
    }

    const db = getDb(empresaId);
    if (!db.produtos.some((p) => String(p.id) === produtoId)) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    const item = createItem(db, produtoId, qtd > 0 ? qtd : 1);
    if (observacao) item.observacao = observacao;
    return NextResponse.json({ ...item, id: normalizeId(item.id), produto_id: normalizeId(item.produto_id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

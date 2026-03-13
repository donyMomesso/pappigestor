import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "../../_db";
import { getSupabaseAdmin, normalizeId, resolveEmpresaId, toNumber } from "@/lib/pappi-server";

export const runtime = "nodejs";

type StatusSolicitacao = "pendente" | "em_cotacao" | "aprovado" | "cancelado" | "comprado";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const empresaId = await resolveEmpresaId(request);
    const { id } = await params;

    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const body = await request.json();
    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.status_solicitacao === "string") {
      const s = body.status_solicitacao as StatusSolicitacao;
      if (["pendente", "em_cotacao", "aprovado", "cancelado", "comprado"].includes(s)) {
        patch.status_solicitacao = s;
      }
    }

    if (typeof body?.quantidade_solicitada !== "undefined") {
      const qtd = toNumber(body.quantidade_solicitada, 0);
      if (qtd > 0) patch.quantidade_solicitada = qtd;
    }

    if (typeof body?.observacao !== "undefined") {
      patch.observacao = body.observacao || null;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("lista_compras")
      .update(patch)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json({
        ...data,
        id: normalizeId(data.id),
        produto_id: normalizeId(data.produto_id),
      });
    }

    const db = getDb(empresaId);
    const item = db.itens.find((i: any) => String(i.id) === String(id));
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (patch.status_solicitacao) item.status_solicitacao = patch.status_solicitacao;
    if (patch.quantidade_solicitada) item.quantidade_solicitada = patch.quantidade_solicitada;
    if ("observacao" in patch) item.observacao = patch.observacao;

    return NextResponse.json({ ...item, id: normalizeId(item.id), produto_id: normalizeId(item.produto_id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const empresaId = await resolveEmpresaId(request);
    const { id } = await params;

    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("lista_compras").delete().eq("id", id).eq("empresa_id", empresaId);

    if (!error) {
      return NextResponse.json({ ok: true });
    }

    const db = getDb(empresaId);
    const idx = db.itens.findIndex((i: any) => String(i.id) === String(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    db.itens.splice(idx, 1);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

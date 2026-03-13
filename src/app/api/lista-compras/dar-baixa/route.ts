import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../_db";
import { getSupabaseAdmin, resolveEmpresaId } from "@/lib/pappi-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Nenhum item informado para baixa" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("lista_compras")
      .update({
        status_solicitacao: "comprado",
        updated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresaId)
      .in("id", ids)
      .select("id");

    if (!error) {
      return NextResponse.json({ ok: true, atualizados: data?.length ?? ids.length, ids });
    }

    const db = getDb(empresaId);
    let atualizados = 0;
    for (const item of db.itens) {
      if (ids.includes(String(item.id))) {
        item.status_solicitacao = "aprovado";
        atualizados++;
      }
    }

    return NextResponse.json({ ok: true, atualizados, ids });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao dar baixa" }, { status: 400 });
  }
}

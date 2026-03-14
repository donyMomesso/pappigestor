import { NextResponse } from "next/server";
import { normalizeRole } from "@/lib/access-control";
import { buildPermissionList, requireActorContext, roleForStorage } from "@/lib/server-access";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, admin, error, status } = await requireActorContext();
    if (!ctx || !admin || !ctx.companyId) {
      return NextResponse.json({ error: error || "Empresa não encontrada" }, { status: status || 400 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};

    if (body?.nivel_acesso) {
      update.role = roleForStorage(normalizeRole(body.nivel_acesso));
    }
    if (typeof body?.is_ativo === "number") {
      update.status = body.is_ativo ? "ativo" : "inativo";
    }
    if (typeof body?.status === "string") {
      update.status = body.status;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    const { data, error: updateError } = await admin
      .from("company_users")
      .update(update)
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .select("id, user_id, role, status, created_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      ...(data as any),
      nivel_acesso: normalizeRole((data as any)?.role),
      permissoes: buildPermissionList(normalizeRole((data as any)?.role)),
      is_ativo: String((data as any)?.status || "ativo").toLowerCase() === "inativo" ? 0 : 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao atualizar usuário" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, admin, error, status } = await requireActorContext();
    if (!ctx || !admin || !ctx.companyId) {
      return NextResponse.json({ error: error || "Empresa não encontrada" }, { status: status || 400 });
    }

    const { id } = await params;

    const { error: deleteError } = await admin
      .from("company_users")
      .update({ status: "removido" })
      .eq("id", id)
      .eq("company_id", ctx.companyId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao remover usuário" }, { status: 500 });
  }
}

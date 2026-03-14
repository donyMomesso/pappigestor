import { NextResponse } from "next/server";
import { requireActorContext } from "@/lib/server-access";

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
      .eq("company_id", ctx.companyId)
      .in("status", ["convidado", "pending"]);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao cancelar convite" }, { status: 500 });
  }
}

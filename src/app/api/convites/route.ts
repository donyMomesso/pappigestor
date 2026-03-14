import { NextResponse } from "next/server";
import { normalizeRole } from "@/lib/access-control";
import {
  buildPermissionList,
  ensureRoleCanBeAssigned,
  findAuthUserByEmail,
  readAuthUsersMap,
  requireActorContext,
  roleForStorage,
} from "@/lib/server-access";
import type { NivelAcesso } from "@/types/auth";

export async function GET() {
  try {
    const { ctx, admin, error, status } = await requireActorContext();
    if (!ctx || !admin || !ctx.companyId) {
      return NextResponse.json({ error: error || "Empresa não encontrada" }, { status: status || 400 });
    }

    const { data: rows, error: listError } = await admin
      .from("company_users")
      .select("id, user_id, role, status, created_at")
      .eq("company_id", ctx.companyId)
      .in("status", ["convidado", "pending"])
      .order("created_at", { ascending: false });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const usersMap = await readAuthUsersMap(admin, (rows || []).map((item: any) => String(item.user_id || "")));

    const payload = (rows || []).map((item: any) => {
      const authUser = usersMap.get(String(item.user_id || ""));
      const role = normalizeRole(item.role);
      return {
        id: String(item.id),
        email: String(authUser?.email || ""),
        nivel_acesso: role,
        status: "pendente",
        empresa_id: ctx.companyId,
        empresa_nome: ctx.companyName,
        token: String(item.user_id || ""),
        created_at: item.created_at,
        aceito_at: null,
        permissoes: buildPermissionList(role),
      };
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao listar convites" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { ctx, admin, error, status } = await requireActorContext();
    if (!ctx || !admin || !ctx.companyId) {
      return NextResponse.json({ error: error || "Empresa não encontrada" }, { status: status || 400 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const nextRole = normalizeRole(body?.nivel_acesso) as NivelAcesso;

    if (!email) return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });

    const permission = await ensureRoleCanBeAssigned({
      admin,
      companyId: ctx.companyId,
      companyPlan: ctx.companyPlan,
      actorRole: ctx.actorRole,
      isSuperAdmin: ctx.isSuperAdmin,
      nextRole,
    });

    if (!permission.ok) {
      return NextResponse.json({ error: permission.reason }, { status: 403 });
    }

    let authUser = await findAuthUserByEmail(admin, email);
    if (!authUser) {
      const invited = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          invited_company_id: ctx.companyId,
          invited_role: roleForStorage(nextRole),
        },
      });
      if (invited.error || !invited.data.user) {
        return NextResponse.json({ error: invited.error?.message || "Falha ao enviar convite" }, { status: 400 });
      }
      authUser = invited.data.user;
    }

    const { data: saved, error: saveError } = await admin
      .from("company_users")
      .upsert(
        {
          company_id: ctx.companyId,
          user_id: authUser.id,
          role: roleForStorage(nextRole),
          status: "convidado",
        },
        { onConflict: "company_id,user_id" },
      )
      .select("id, user_id, role, status, created_at")
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 400 });
    }

    return NextResponse.json({
      id: String((saved as any)?.id || ""),
      email,
      nivel_acesso: nextRole,
      status: "pendente",
      empresa_id: ctx.companyId,
      empresa_nome: ctx.companyName,
      token: authUser.id,
      created_at: (saved as any)?.created_at ?? new Date().toISOString(),
      aceito_at: null,
      permissoes: buildPermissionList(nextRole),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao enviar convite" }, { status: 500 });
  }
}

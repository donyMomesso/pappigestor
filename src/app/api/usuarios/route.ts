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

    const { data: memberships, error: listError } = await admin
      .from("company_users")
      .select("id, user_id, role, status, created_at")
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: true });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const usersMap = await readAuthUsersMap(
      admin,
      (memberships || []).map((item: any) => String(item.user_id || "")).filter(Boolean),
    );

    const payload = (memberships || [])
      .filter((item: any) => String(item.status || "ativo").toLowerCase() !== "removido")
      .map((item: any) => {
        const authUser = usersMap.get(String(item.user_id || ""));
        const role = normalizeRole(item.role);
        const statusValue = String(item.status || "ativo").toLowerCase();
        return {
          id: String(item.id),
          user_id: String(item.user_id || ""),
          nome: String(authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "Usuário"),
          email: String(authUser?.email || ""),
          empresa_id: ctx.companyId,
          empresa_nome: ctx.companyName,
          nivel_acesso: role,
          is_ativo: statusValue === "inativo" ? 0 : 1,
          status: statusValue,
          created_at: item.created_at,
          permissoes: buildPermissionList(role),
        };
      });

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao listar usuários" }, { status: 500 });
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
    const nome = String(body?.nome || "").trim();
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
    let membershipStatus = "ativo";

    if (!authUser) {
      const invited = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: nome || email.split("@")[0],
          invited_company_id: ctx.companyId,
          invited_role: roleForStorage(nextRole),
        },
      });
      if (invited.error || !invited.data.user) {
        return NextResponse.json({ error: invited.error?.message || "Falha ao convidar usuário" }, { status: 400 });
      }
      authUser = invited.data.user;
      membershipStatus = "convidado";
    }

    const payload = {
      company_id: ctx.companyId,
      user_id: authUser.id,
      role: roleForStorage(nextRole),
      status: membershipStatus,
    };

    const { data: saved, error: saveError } = await admin
      .from("company_users")
      .upsert(payload, { onConflict: "company_id,user_id" })
      .select("id, user_id, role, status, created_at")
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 400 });
    }

    return NextResponse.json({
      id: String((saved as any)?.id || ""),
      user_id: authUser.id,
      nome: String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || nome || email.split("@")[0]),
      email,
      empresa_id: ctx.companyId,
      empresa_nome: ctx.companyName,
      nivel_acesso: nextRole,
      is_ativo: membershipStatus === "inativo" ? 0 : 1,
      status: membershipStatus,
      permissoes: buildPermissionList(nextRole),
      created_at: (saved as any)?.created_at ?? new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao criar usuário" }, { status: 500 });
  }
}

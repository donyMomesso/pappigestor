import { createClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ROLE_PERMISSIONS,
  canAssignRole,
  getPlanLimits,
  normalizePlan,
  normalizeRole,
  storageRoleForDb,
} from "@/lib/access-control";
import type { NivelAcesso, PlanoEmpresa } from "@/types/auth";

export interface ServerActorContext {
  userId: string;
  email: string;
  companyId: string | null;
  companyName: string;
  companyPlan: PlanoEmpresa;
  actorRole: NivelAcesso;
  isSuperAdmin: boolean;
}

export async function requireActorContext(): Promise<{ ctx: ServerActorContext | null; admin: ReturnType<typeof getSupabaseAdmin>; error?: string; status?: number; supabase?: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  if (!supabase) return { ctx: null, admin: null, error: "Supabase não configurado", status: 500, supabase };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ctx: null, admin: null, error: "Não autenticado", status: 401, supabase };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { ctx: null, admin: null, error: "Admin indisponível", status: 500, supabase };

  const { data: membership } = await admin
    .from("company_users")
    .select("id, company_id, role, status")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const companyId = String((membership as any)?.company_id || user.user_metadata?.empresa_id || "").trim() || null;
  const actorRole = normalizeRole((membership as any)?.role || user.user_metadata?.nivel_acesso || "dono");
  const isSuperAdmin = actorRole === "admin" && String((membership as any)?.role || "").trim().toLowerCase() === "super_admin";

  let company: Record<string, any> | null = null;
  if (companyId) {
    const { data } = await admin
      .from("companies")
      .select("id, name, plano")
      .eq("id", companyId)
      .maybeSingle();
    company = (data as Record<string, any> | null) ?? null;
  }

  return {
    ctx: {
      userId: user.id,
      email: String(user.email || "").toLowerCase(),
      companyId,
      companyName: String(company?.name || user.user_metadata?.nome_empresa || "Minha Empresa"),
      companyPlan: normalizePlan(company?.plano || user.user_metadata?.plano || "basico"),
      actorRole,
      isSuperAdmin,
    },
    admin,
    supabase,
  };
}

export function normalizeMembershipStatus(raw: unknown): "ativo" | "convidado" | "inativo" | "removido" {
  const value = String(raw || "ativo").trim().toLowerCase();
  if (["pending", "pendente", "convidado", "invited"].includes(value)) return "convidado";
  if (["inactive", "inativo", "disabled"].includes(value)) return "inativo";
  if (["removed", "removido", "deleted"].includes(value)) return "removido";
  return "ativo";
}

export async function getCompanyMembershipMetrics(admin: ReturnType<typeof getSupabaseAdmin>, companyId: string) {
  if (!admin) {
    return {
      activeUsers: 0,
      activeAdmins: 0,
    };
  }

  const { count: activeUsers } = await admin
    .from("company_users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["ativo", "convidado", "active", "pending"]);

  const { count: activeAdmins } = await admin
    .from("company_users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["ativo", "convidado", "active", "pending"])
    .in("role", ["admin_empresa", "admin", "dono", "super_admin"]);

  return {
    activeUsers: Number(activeUsers ?? 0),
    activeAdmins: Number(activeAdmins ?? 0),
  };
}

export async function ensureRoleCanBeAssigned(args: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  companyId: string;
  companyPlan: PlanoEmpresa;
  actorRole: NivelAcesso;
  isSuperAdmin?: boolean;
  nextRole: NivelAcesso;
}) {
  const metrics = await getCompanyMembershipMetrics(args.admin, args.companyId);
  return canAssignRole({
    plan: args.companyPlan,
    currentRole: args.actorRole,
    nextRole: args.nextRole,
    activeAdmins: metrics.activeAdmins,
    activeUsers: metrics.activeUsers,
    isSuperAdmin: args.isSuperAdmin,
  });
}

export async function findAuthUserByEmail(admin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle || !admin) return null;

  let page = 1;
  while (page <= 10) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const found = result.data.users.find((item) => String(item.email || "").toLowerCase() === needle);
    if (found) return found;
    if (!result.data?.users?.length || result.data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function readAuthUsersMap(admin: ReturnType<typeof getSupabaseAdmin>, userIds: string[]) {
  const wanted = new Set(userIds.filter(Boolean));
  const map = new Map<string, any>();
  if (!wanted.size || !admin) return map;

  let page = 1;
  while (page <= 15 && map.size < wanted.size) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 200 });
    for (const item of result.data.users) {
      if (wanted.has(item.id)) map.set(item.id, item);
    }
    if (!result.data?.users?.length || result.data.users.length < 200) break;
    page += 1;
  }

  return map;
}

export function buildPermissionList(role: NivelAcesso) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function companyPlanSummary(plan: PlanoEmpresa) {
  const limits = getPlanLimits(plan);
  return {
    plan,
    limits,
  };
}

export function roleForStorage(role: NivelAcesso) {
  return storageRoleForDb(role);
}
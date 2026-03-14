import type { Feature, NivelAcesso, PlanoEmpresa } from "@/types/auth";
import type { AssinaturaStatus, PlanoLimites, TrialInfo } from "@/types/access-control";

const PLAN_LIMITS: Record<PlanoEmpresa, PlanoLimites> = {
  gratis: { usuariosTotal: 2, admins: 1, filiais: 1 },
  basico: { usuariosTotal: 5, admins: 2, filiais: 1 },
  profissional: { usuariosTotal: 20, admins: 5, filiais: 3 },
  enterprise: { usuariosTotal: 999, admins: 25, filiais: 20 },
};

const PLAN_FEATURES: Record<PlanoEmpresa, Feature[]> = {
  gratis: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",
  ],
  basico: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",
  ],
  profissional: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",
    "assessor_ia",
    "caixa_entrada",
    "cotacao",
    "dda",
    "dashboard_avancado",
    "produtos_master",
  ],
  enterprise: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",
    "assessor_ia",
    "caixa_entrada",
    "cotacao",
    "dda",
    "dashboard_avancado",
    "produtos_master",
  ],
};

export const ROLE_LABELS: Record<NivelAcesso, string> = {
  dono: "Dono",
  admin: "Administrador",
  financeiro: "Financeiro",
  comprador: "Comprador",
  operador: "Operador",
  viewer: "Visualizador",
};

export const ROLE_PERMISSIONS: Record<NivelAcesso, string[]> = {
  dono: ["*"],
  admin: [
    "usuarios.read",
    "usuarios.write",
    "convites.write",
    "configuracoes.write",
    "compras.write",
    "estoque.write",
    "financeiro.read",
    "fornecedores.write",
    "produtos.write",
    "dashboard.read",
  ],
  financeiro: [
    "financeiro.read",
    "financeiro.write",
    "recebimento.read",
    "dashboard.read",
    "fornecedores.read",
  ],
  comprador: [
    "compras.read",
    "compras.write",
    "cotacao.read",
    "cotacao.write",
    "fornecedores.read",
    "fornecedores.write",
    "produtos.read",
    "produtos.write",
    "estoque.read",
    "dashboard.read",
  ],
  operador: [
    "estoque.read",
    "estoque.write",
    "recebimento.read",
    "recebimento.write",
    "produtos.read",
    "compras.read",
    "dashboard.read",
  ],
  viewer: ["dashboard.read", "compras.read", "estoque.read", "financeiro.read", "produtos.read", "fornecedores.read"],
};

export function normalizePlan(raw: unknown): PlanoEmpresa {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "grátis" || value === "gratis") return "gratis";
  if (value === "básico" || value === "basico") return "basico";
  if (value === "pro" || value === "profissional") return "profissional";
  if (value === "enterprise") return "enterprise";
  return "basico";
}

export function normalizeRole(raw: unknown): NivelAcesso {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "admin_empresa") return "dono";
  if (value === "super_admin") return "admin";
  if (value === "dono") return "dono";
  if (value === "admin") return "admin";
  if (value === "financeiro") return "financeiro";
  if (value === "comprador") return "comprador";
  if (value === "viewer" || value === "visualizador") return "viewer";
  return "operador";
}

export function storageRoleForDb(role: NivelAcesso): string {
  if (role === "dono") return "admin_empresa";
  return role;
}

export function normalizeAssinaturaStatus(raw: unknown): AssinaturaStatus {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "ativa" || value === "ativo") return "ativa";
  if (value === "vencida") return "vencida";
  if (value === "cancelada" || value === "cancelado") return "cancelada";
  if (value === "bloqueada" || value === "bloqueado") return "bloqueada";
  if (value === "inadimplente") return "inadimplente";
  return "teste_gratis";
}

export function getPlanLimits(plan: PlanoEmpresa): PlanoLimites {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.basico;
}

export function getPlanFeatures(plan: PlanoEmpresa): Feature[] {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.basico;
}

export function getAllowedRolesForPlan(plan: PlanoEmpresa): NivelAcesso[] {
  switch (plan) {
    case "gratis":
      return ["dono", "operador"];
    case "basico":
      return ["dono", "admin", "operador", "comprador", "viewer"];
    case "profissional":
    case "enterprise":
      return ["dono", "admin", "financeiro", "comprador", "operador", "viewer"];
    default:
      return ["dono", "operador"];
  }
}

export function getAssignableRoles(args: { plan: PlanoEmpresa; currentRole: NivelAcesso; isSuperAdmin?: boolean }): NivelAcesso[] {
  if (args.isSuperAdmin) return ["dono", "admin", "financeiro", "comprador", "operador", "viewer"];
  const allowed = getAllowedRolesForPlan(args.plan);
  if (args.currentRole === "dono") return allowed;
  if (args.currentRole === "admin") return allowed.filter((role) => !["dono", "admin"].includes(role));
  return [];
}

export function canAssignRole(args: {
  plan: PlanoEmpresa;
  currentRole: NivelAcesso;
  nextRole: NivelAcesso;
  activeAdmins: number;
  activeUsers: number;
  isSuperAdmin?: boolean;
}) {
  const assignable = getAssignableRoles(args);
  if (!assignable.includes(args.nextRole)) {
    return { ok: false, reason: "Seu perfil não pode atribuir esse nível de acesso." };
  }
  return canInviteMoreUsers({
    plan: args.plan,
    activeUsers: args.activeUsers,
    activeAdmins: args.activeAdmins,
    nextRole: args.nextRole,
  });
}

export function resolveTrialInfo(trialEndsAt: string | null, trialStartedAt?: string | null): TrialInfo {
  if (!trialEndsAt) {
    return {
      startedAt: trialStartedAt ?? null,
      endsAt: null,
      remainingDays: 0,
      expired: false,
    };
  }

  const now = Date.now();
  const ends = new Date(trialEndsAt).getTime();
  const remainingMs = ends - now;
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return {
    startedAt: trialStartedAt ?? null,
    endsAt: trialEndsAt,
    remainingDays,
    expired: remainingMs < 0,
  };
}

export function isSubscriptionBlocked(status: AssinaturaStatus, trial: TrialInfo) {
  if (status === "bloqueada" || status === "cancelada" || status === "inadimplente" || status === "vencida") {
    return true;
  }
  if (status === "teste_gratis" && trial.expired) {
    return true;
  }
  return false;
}

export function canAccessFeature(args: {
  plan: PlanoEmpresa;
  feature: Feature;
  statusAssinatura: AssinaturaStatus;
  trial: TrialInfo;
}) {
  const { plan, feature, statusAssinatura, trial } = args;
  if (isSubscriptionBlocked(statusAssinatura, trial)) return false;
  return getPlanFeatures(plan).includes(feature);
}

export function canInviteMoreUsers(args: {
  plan: PlanoEmpresa;
  activeUsers: number;
  activeAdmins: number;
  nextRole: NivelAcesso;
}) {
  const limits = getPlanLimits(args.plan);
  if (args.activeUsers >= limits.usuariosTotal) {
    return { ok: false, reason: "Limite total de usuários do plano atingido." };
  }

  const nextIsAdmin = ["dono", "admin"].includes(args.nextRole);
  if (nextIsAdmin && args.activeAdmins >= limits.admins) {
    return { ok: false, reason: "Limite de administradores do plano atingido." };
  }

  return { ok: true, reason: null };
}

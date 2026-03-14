import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ROLE_PERMISSIONS,
  canAccessFeature,
  getAssignableRoles,
  getPlanFeatures,
  getPlanLimits,
  isSubscriptionBlocked,
  normalizeAssinaturaStatus,
  normalizePlan,
  normalizeRole,
  resolveTrialInfo,
} from "@/lib/access-control";
import type { AppSessionPayload } from "@/types/access-control";

function slugifyCode(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toUpperCase()
    .slice(0, 12);
}

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase não configurado" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    const db = admin ?? supabase;

    const { data: membership } = await db
      .from("company_users")
      .select("id, company_id, role, status")
      .eq("user_id", user.id)
      .in("status", ["ativo", "convidado", "active", "pending"])
      .limit(1)
      .maybeSingle();

    const companyId =
      String(
        (membership as any)?.company_id ||
          user.user_metadata?.empresa_id ||
          ""
      ).trim() || null;

    let company: Record<string, any> | null = null;

    if (companyId) {
      const { data } = await db
        .from("companies")
        .select(
          "id,name,plano,status,status_assinatura,trial_started_at,trial_ends_at,assinatura_expires_at,limite_usuarios_total,limite_admins,limite_filiais,bloquear_recebimento,referral_code,referral_credit_balance_cents,referral_credit_earned_cents,referrer_company_id,cnpj"
        )
        .eq("id", companyId)
        .maybeSingle();

      company = (data as Record<string, any> | null) ?? null;
    }

    const plan = normalizePlan(
      company?.plano ?? user.user_metadata?.plano ?? "basico"
    );

    const role = normalizeRole(
      (membership as any)?.role ??
        user.user_metadata?.nivel_acesso ??
        "operador"
    );

    const assinaturaStatus = normalizeAssinaturaStatus(
      company?.status_assinatura ?? "teste_gratis"
    );

    const trial = resolveTrialInfo(
      company?.trial_ends_at ?? null,
      company?.trial_started_at ?? null
    );

    const blocked = isSubscriptionBlocked(assinaturaStatus, trial);

    const planFeatures = getPlanFeatures(plan);

    const features = blocked
      ? planFeatures.filter((feature) =>
          canAccessFeature({
            plan,
            feature,
            statusAssinatura: assinaturaStatus,
            trial,
          })
        )
      : planFeatures;

    const baseLimits = getPlanLimits(plan);

    const limits = {
      usuariosTotal: Number(
        company?.limite_usuarios_total ?? baseLimits.usuariosTotal
      ),
      admins: Number(company?.limite_admins ?? baseLimits.admins),
      filiais: Number(company?.limite_filiais ?? baseLimits.filiais),
    };

    const fallbackReferralCode =
      company?.referral_code ||
      slugifyCode(String(company?.name || user.email || "PAPPI"));

    const permissoes = ROLE_PERMISSIONS[role] ?? [];

    const summary: AppSessionPayload = {
      user: {
        id: user.id,
        nome: String(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Usuário"
        ),
        email: user.email || "",
        foto: String(
          user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            ""
        ),
        permissoes,
        features,
      } as any,
      membership: {
        empresaUsuarioId: (membership as any)?.id
          ? String((membership as any).id)
          : null,
        role,
        status: ((membership as any)?.status || "ativo") as any,
        permissoes,
        rolesPermitidos: getAssignableRoles({
          plan,
          currentRole: role,
        }),
      },
      empresaAtual: {
        id: company?.id ? String(company.id) : companyId,
        nome: String(
          company?.name ||
            user.user_metadata?.nome_empresa ||
            "Minha Empresa"
        ),
        plano: plan,
        status: String(company?.status || "ativa"),
        statusAssinatura: assinaturaStatus,
        trialEndsAt: company?.trial_ends_at ?? null,
        assinaturaExpiresAt: company?.assinatura_expires_at ?? null,
        limites: limits,
        features,
        recebimentoBloqueado:
          blocked || Boolean(company?.bloquear_recebimento),
        cnpj: company?.cnpj ?? null,
      } as any,
      trial,
      referralWallet: {
        referralCode: fallbackReferralCode,
        creditBalanceCents: Number(
          company?.referral_credit_balance_cents ?? 0
        ),
        creditEarnedCents: Number(
          company?.referral_credit_earned_cents ?? 0
        ),
        totalReferrals: Number(company?.referrer_company_id ? 1 : 0),
      },
    };

    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Falha ao montar sessão do app",
        details: error?.message ?? null,
      },
      { status: 500 }
    );
  }
}

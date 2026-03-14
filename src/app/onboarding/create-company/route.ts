import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePlan } from "@/lib/access-control";

function makeReferralCode(companyName: string, userId: string) {
  const base = `${companyName}-${userId.slice(0, 6)}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toUpperCase();

  return base.slice(0, 18) || `PAPPI-${userId.slice(0, 6).toUpperCase()}`;
}

type CompanyRefRow = {
  id?: string | null;
  referral_credit_balance_cents?: number | null;
  referral_credit_earned_cents?: number | null;
};

export async function POST(req: Request) {
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
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const name = String(body?.nomeFantasia || "").trim();
    const razaoSocial = String(body?.razaoSocial || "").trim();
    const cnpj = String(body?.cnpj || "").replace(/\D/g, "");
    const referralCode =
      String(body?.referralCode || "").trim().toUpperCase() || null;
    const plan = normalizePlan(body?.plano || "basico");

    if (!name || !razaoSocial || cnpj.length !== 14) {
      return NextResponse.json(
        { error: "Dados da empresa inválidos." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const db = admin ?? supabase;

    let referrerCompanyId: string | null = null;

    if (referralCode) {
      const { data: refCompany } = await db
        .from("companies")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();

      referrerCompanyId = ((refCompany as CompanyRefRow | null)?.id ?? null) as string | null;
    }

    // Evita criar empresa duplicada pelo mesmo CNPJ
    const { data: existingCompany } = await db
      .from("companies")
      .select("id, name, referral_code")
      .eq("cnpj", cnpj)
      .maybeSingle();

    let companyId: string | null = null;
    let companyReferralCode: string | null = null;

    if (existingCompany?.id) {
      companyId = String(existingCompany.id);
      companyReferralCode = String(existingCompany.referral_code || "") || null;
    } else {
      const trialStartedAt = new Date();
      const trialEndsAt = new Date(
        trialStartedAt.getTime() + 15 * 24 * 60 * 60 * 1000
      );

      const { data: company, error: companyError } = await db
        .from("companies")
        .insert([
          {
            name,
            razao_social: razaoSocial,
            cnpj,
            created_by: user.id,
            plano: plan,
            status: "ativa",
            status_assinatura: "teste_gratis",
            trial_started_at: trialStartedAt.toISOString(),
            trial_ends_at: trialEndsAt.toISOString(),
            referral_code: makeReferralCode(name, user.id),
            referrer_company_id: referrerCompanyId,
          },
        ])
        .select("id, referral_code")
        .single();

      const companyRow = company as { id?: string; referral_code?: string } | null;

      if (companyError || !companyRow?.id) {
        return NextResponse.json(
          { error: companyError?.message || "Falha ao criar empresa" },
          { status: 400 }
        );
      }

      companyId = String(companyRow.id);
      companyReferralCode = companyRow?.referral_code ?? null;

      if (admin && referrerCompanyId) {
        const { error: referralRpcError } = await admin.rpc(
          "increment_referral_credit",
          {
            p_company_id: referrerCompanyId,
            p_amount_cents: 5000,
          }
        );

        if (referralRpcError) {
          const { data: current } = await admin
            .from("companies")
            .select(
              "referral_credit_balance_cents, referral_credit_earned_cents"
            )
            .eq("id", referrerCompanyId)
            .maybeSingle();

          const currentRow = current as CompanyRefRow | null;

          const { error: fallbackError } = await admin
            .from("companies")
            .update({
              referral_credit_balance_cents:
                Number(currentRow?.referral_credit_balance_cents ?? 0) + 5000,
              referral_credit_earned_cents:
                Number(currentRow?.referral_credit_earned_cents ?? 0) + 5000,
            })
            .eq("id", referrerCompanyId);

          if (fallbackError) {
            console.error(
              "Erro ao aplicar crédito de indicação no fallback:",
              fallbackError.message
            );
          }
        }
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Não foi possível determinar a empresa criada." },
        { status: 400 }
      );
    }

    // Evita duplicidade de vínculo
    const { data: existingMembership } = await db
      .from("company_users")
      .select("id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingMembership?.id) {
      const { error: linkError } = await db.from("company_users").insert([
        {
          company_id: companyId,
          user_id: user.id,
          role: "admin_empresa",
          status: "ativo",
        },
      ]);

      if (linkError) {
        return NextResponse.json(
          { error: linkError.message },
          { status: 400 }
        );
      }
    }

    const { error: updErr } = await supabase.auth.updateUser({
      data: {
        nome_empresa: name,
        empresa_id: companyId,
        plano: plan,
        nivel_acesso: "dono",
        pId: companyId,
        pizzariaId: companyId,
      },
    });

    if (updErr) {
      return NextResponse.json(
        { error: updErr.message },
        { status: 400 }
      );
    }

    const trialEndsAt = new Date(
      Date.now() + 15 * 24 * 60 * 60 * 1000
    ).toISOString();

    return NextResponse.json({
      ok: true,
      companyId,
      company: {
        id: companyId,
        name,
        cnpj,
      },
      membership: {
        role: "dono",
        status: "ativo",
      },
      referralCode: companyReferralCode,
      trialEndsAt,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Falha ao criar empresa",
        details: error instanceof Error ? error.message : null,
      },
      { status: 500 }
    );
  }
  }

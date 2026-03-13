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

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.nomeFantasia || "").trim();
    const razaoSocial = String(body?.razaoSocial || "").trim();
    const cnpj = String(body?.cnpj || "").replace(/\D/g, "");
    const referralCode = String(body?.referralCode || "").trim().toUpperCase() || null;
    const plan = normalizePlan(body?.plano || "basico");

    if (!name || !razaoSocial || cnpj.length !== 14) {
      return NextResponse.json({ error: "Dados da empresa inválidos." }, { status: 400 });
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
      referrerCompanyId = (refCompany as any)?.id ?? null;
    }

    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 15 * 24 * 60 * 60 * 1000);

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

    if (companyError || !(company as any)?.id) {
      return NextResponse.json({ error: companyError?.message || "Falha ao criar empresa" }, { status: 400 });
    }

    const companyId = String((company as any).id);

    const { error: linkError } = await db.from("company_users").insert([
      {
        company_id: companyId,
        user_id: user.id,
        role: "admin_empresa",
        status: "ativo",
      },
    ]);

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    if (admin && referrerCompanyId) {
      await admin.rpc("increment_referral_credit", {
        p_company_id: referrerCompanyId,
        p_amount_cents: 5000,
      }).catch(async () => {
        const { data: current } = await admin
          .from("companies")
          .select("referral_credit_balance_cents, referral_credit_earned_cents")
          .eq("id", referrerCompanyId)
          .maybeSingle();

        await admin
          .from("companies")
          .update({
            referral_credit_balance_cents: Number((current as any)?.referral_credit_balance_cents ?? 0) + 5000,
            referral_credit_earned_cents: Number((current as any)?.referral_credit_earned_cents ?? 0) + 5000,
          })
          .eq("id", referrerCompanyId);
      });
    }

    const { error: updErr } = await supabase.auth.updateUser({
      data: {
        nome_empresa: name,
        empresa_id: companyId,
        plano: plan,
        nivel_acesso: "dono",
      },
    });

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      companyId,
      referralCode: (company as any)?.referral_code ?? null,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Falha ao criar empresa", details: error?.message ?? null },
      { status: 500 },
    );
  }
}

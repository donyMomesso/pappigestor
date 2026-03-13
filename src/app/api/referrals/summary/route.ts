import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function fallbackReferralCode(name: string, id: string) {
  const base = `${name}-${id.slice(0, 4)}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toUpperCase();
  return base.slice(0, 18) || `PAPPI-${id.slice(0, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const db = admin ?? supabase;

    const { data: membership } = await db
      .from("company_users")
      .select("company_id")
      .eq("user_id", authData.user.id)
      .limit(1)
      .maybeSingle();

    const companyId = (membership as any)?.company_id;
    if (!companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const { data: company } = await db
      .from("companies")
      .select("id, name, referral_code, referral_credit_balance_cents, referral_credit_earned_cents")
      .eq("id", companyId)
      .maybeSingle();

    const { data: referredCompanies } = await db
      .from("companies")
      .select("id, name, created_at")
      .eq("referrer_company_id", companyId)
      .order("created_at", { ascending: false });

    const referralCode = (company as any)?.referral_code || fallbackReferralCode((company as any)?.name || "PAPPI", String(companyId));

    if (admin && !(company as any)?.referral_code) {
      await admin.from("companies").update({ referral_code: referralCode }).eq("id", companyId);
    }

    return NextResponse.json({
      ok: true,
      referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || ""}/cadastro?ref=${referralCode}`,
      creditBalanceCents: Number((company as any)?.referral_credit_balance_cents ?? 0),
      creditEarnedCents: Number((company as any)?.referral_credit_earned_cents ?? 0),
      referredCompanies: referredCompanies ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Falha ao carregar créditos de indicação", details: error?.message ?? null },
      { status: 500 },
    );
  }
}

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
        .select(`
          id,
          name,
          plano,
          status,
          status_assinatura,
          trial_started_at,
          trial_ends_at,
          assinatura_expires_at,
          limite_usuarios_total,
          limite_admins,
          limite_filiais,
          bloquear_recebimento,
          referral_code,
          referral_credit_balance_cents,
          referral_credit_earned_cents,

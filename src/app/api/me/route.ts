// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { LocalUser, NivelAcesso } from "@/hooks/useAppAuth";

function normalizeRole(role: any): NivelAcesso {
  const r = String(role ?? "").toLowerCase().trim();

  if (r === "super_admin") return "super_admin";
  if (r === "admin_empresa" || r === "admin") return "admin_empresa";
  if (r === "financeiro") return "financeiro";
  if (r === "comprador") return "comprador";

  return "operador";
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    // Sessão atual
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw sessErr;

    const session = sessionData.session;
    if (!session?.user) {
      return NextResponse.json(null, { status: 401 });
    }

    const user = session.user;
    const userId = user.id;

    // vínculo empresa
    const { data: link } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!link?.company_id) {
      const localUser: LocalUser = {
        id: userId,
        nome: (user.user_metadata?.full_name as string) ?? "Usuário",
        email: user.email ?? "",
        nivel_acesso: "operador",
        empresa_id: "",
        empresa_nome: "",
        features: [],
      };
      return NextResponse.json(localUser);
    }

    const companyId = link.company_id as string;
    const role = normalizeRole(link.role);

    // nome da empresa
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();

    // features
    const { data: feats } = await supabase
      .from("company_features")
      .select("feature, enabled")
      .eq("company_id", companyId);

    const features = (feats ?? [])
      .filter((f: any) => !!f.enabled)
      .map((f: any) => f.feature as string);

    const localUser: LocalUser = {
      id: userId,
      nome: (user.user_metadata?.full_name as string) ?? "Usuário",
      email: user.email ?? "",
      nivel_acesso: role,
      empresa_id: companyId,
      empresa_nome: company?.name ?? "",
      features,
    };

    return NextResponse.json(localUser);
  } catch (err: any) {
    console.error("auth/me error:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
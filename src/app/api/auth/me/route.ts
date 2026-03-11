import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabaseClient";

type NivelAcesso =
  | "super_admin"
  | "admin_empresa"
  | "financeiro"
  | "comprador"
  | "operador";

type LocalUser = {
  id: string;
  nome: string;
  email: string;
  nivel_acesso: NivelAcesso;
  empresa_id: string;
  empresa_nome: string;
  features: string[];
};

type UserRow = {
  id: string;
  nome?: string | null;
  email?: string | null;
};

type CompanyUserRow = {
  company_id?: string | null;
  role?: string | null;
};

type CompanyRow = {
  name?: string | null;
};

type CompanyFeatureRow = {
  feature: string;
  enabled: boolean;
};

function normalizeRole(role: unknown): NivelAcesso {
  const r = String(role ?? "").toLowerCase().trim();

  if (r === "super_admin") return "super_admin";
  if (r === "admin_empresa" || r === "admin") return "admin_empresa";
  if (r === "financeiro") return "financeiro";
  if (r === "comprador") return "comprador";

  return "operador";
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(null, { status: 401 });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 500 },
    );
  }

  try {
    const email = session.user.email;

    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id, nome, email")
      .eq("email", email)
      .maybeSingle();

    if (userErr) throw userErr;

    const typedUserRow = userRow as UserRow | null;

    if (!typedUserRow?.id) {
      const localUser: LocalUser = {
        id: "",
        nome:
          typeof session.user.name === "string" && session.user.name.trim()
            ? session.user.name
            : "Usuário",
        email,
        nivel_acesso: "operador",
        empresa_id: "",
        empresa_nome: "",
        features: [],
      };

      return NextResponse.json(localUser);
    }

    const userId = String(typedUserRow.id);

    const { data: link, error: linkErr } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (linkErr) throw linkErr;

    const typedLink = link as CompanyUserRow | null;

    if (!typedLink?.company_id) {
      const localUser: LocalUser = {
        id: userId,
        nome:
          typeof typedUserRow.nome === "string" && typedUserRow.nome.trim()
            ? typedUserRow.nome
            : typeof session.user.name === "string" && session.user.name.trim()
              ? session.user.name
              : "Usuário",
        email,
        nivel_acesso: "operador",
        empresa_id: "",
        empresa_nome: "",
        features: [],
      };

      return NextResponse.json(localUser);
    }

    const companyId = String(typedLink.company_id);
    const role = normalizeRole(typedLink.role);

    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();

    if (companyErr) throw companyErr;

    const typedCompany = company as CompanyRow | null;

    const { data: feats, error: featsErr } = await supabase
      .from("company_features")
      .select("feature, enabled")
      .eq("company_id", companyId);

    if (featsErr) throw featsErr;

    const typedFeats = (feats ?? []) as CompanyFeatureRow[];

    const features: string[] = typedFeats
      .filter((f) => Boolean(f.enabled))
      .map((f) => String(f.feature));

    const localUser: LocalUser = {
      id: userId,
      nome:
        typeof typedUserRow.nome === "string" && typedUserRow.nome.trim()
          ? typedUserRow.nome
          : typeof session.user.name === "string" && session.user.name.trim()
            ? session.user.name
            : "Usuário",
      email,
      nivel_acesso: role,
      empresa_id: companyId,
      empresa_nome: typeof typedCompany?.name === "string" ? typedCompany.name : "",
      features,
    };

    return NextResponse.json(localUser);
  } catch (err: unknown) {
    console.error("auth/me error:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
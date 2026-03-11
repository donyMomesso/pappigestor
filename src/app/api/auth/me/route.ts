// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * Este endpoint retorna o "localUser" usado no front.
 * Mantive a lógica original, mas deixei tipos mais tolerantes
 * e adicionei checagens para evitar crashes por valores nulos/undefined.
 */

// Roles locais (mantive os nomes que você usou)
type NivelAcesso =
  | "super_admin"
  | "admin_empresa"
  | "financeiro"
  | "comprador"
  | "operador";

// Tipo retornado ao front (tornei campos opcionais para compatibilidade)
type LocalUser = {
  id?: string;
  nome?: string;
  email?: string;
  nivel_acesso?: NivelAcesso;
  empresa_id?: string;
  empresa_nome?: string;
  features?: string[];
};

// Tipos auxiliares para as queries
type UserRow = {
  id?: string | null;
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
  feature?: string | null;
  enabled?: boolean | null;
};

function normalizeRole(role: unknown): NivelAcesso {
  const r = String(role ?? "").toLowerCase().trim();

  if (r === "super_admin" || r === "superadmin") return "super_admin";
  if (r === "admin_empresa" || r === "admin") return "admin_empresa";
  if (r === "financeiro") return "financeiro";
  if (r === "comprador") return "comprador";

  return "operador";
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(null, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
    }

    const email = session.user.email;

    // busca usuário na tabela users
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id, nome, email")
      .eq("email", email)
      .maybeSingle();

    if (userErr) {
      console.error("supabase users error:", userErr);
      throw userErr;
    }

    const typedUserRow = (userRow ?? null) as UserRow | null;

    // se usuário não existe na tabela, devolve um localUser mínimo (fallback)
    if (!typedUserRow?.id) {
      const localUser: LocalUser = {
        id: undefined,
        nome:
          typeof session.user.name === "string" && session.user.name.trim()
            ? session.user.name
            : "Usuário",
        email,
        nivel_acesso: "operador",
        empresa_id: undefined,
        empresa_nome: undefined,
        features: [],
      };

      return NextResponse.json(localUser);
    }

    const userId = String(typedUserRow.id);

    // busca vínculo company_users
    const { data: link, error: linkErr } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (linkErr) {
      console.error("supabase company_users error:", linkErr);
      throw linkErr;
    }

    const typedLink = (link ?? null) as CompanyUserRow | null;

    // se não há vínculo com empresa, devolve localUser com empresa vazia
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
        empresa_id: undefined,
        empresa_nome: undefined,
        features: [],
      };

      return NextResponse.json(localUser);
    }

    const companyId = String(typedLink.company_id);
    const role = normalizeRole(typedLink.role);

    // busca dados da company
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();

    if (companyErr) {
      console.error("supabase companies error:", companyErr);
      throw companyErr;
    }

    const typedCompany = (company ?? null) as CompanyRow | null;

    // busca features da company
    const { data: feats, error: featsErr } = await supabase
      .from("company_features")
      .select("feature, enabled")
      .eq("company_id", companyId);

    if (featsErr) {
      console.error("supabase company_features error:", featsErr);
      throw featsErr;
    }

    const typedFeats = (feats ?? []) as CompanyFeatureRow[];

    const features: string[] = typedFeats
      .filter((f) => Boolean(f?.enabled) && f.feature)
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
      empresa_nome: typeof typedCompany?.name === "string" ? typedCompany.name : undefined,
      features,
    };

    return NextResponse.json(localUser);
  } catch (err: unknown) {
    console.error("auth/me error:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
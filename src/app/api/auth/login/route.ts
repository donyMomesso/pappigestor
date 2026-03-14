import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function proxyWorker(email: string) {
  const workerUrl = process.env.WORKER_URL?.trim();
  if (!workerUrl) return null;

  const response = await fetch(`${workerUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function proxyCompanies(email: string) {
  const workerUrl = process.env.WORKER_URL?.trim();
  if (!workerUrl) return null;

  const response = await fetch(`${workerUrl}/api/empresas/minhas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    data,
  };
}

function normalizeRole(raw: unknown) {
  const value = String(raw || "").trim().toLowerCase();

  if (value === "super_admin") return "admin";
  if (value === "admin_empresa") return "dono";
  if (value === "dono") return "dono";
  if (value === "admin") return "admin";
  if (value === "financeiro") return "financeiro";
  if (value === "comprador") return "comprador";
  if (value === "viewer") return "viewer";

  return "operador";
}

function normalizePlan(raw: unknown) {
  const value = String(raw || "").trim().toLowerCase();

  if (value === "gratis" || value === "grátis") return "gratis";
  if (value === "basico" || value === "básico") return "basico";
  if (value === "pro") return "profissional";
  if (value === "profissional") return "profissional";
  if (value === "enterprise") return "enterprise";

  return "basico";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email ausente" }, { status: 400 });
    }

    // 1) Tenta worker primeiro
    const login = await proxyWorker(email).catch(() => null);
    if (login?.ok && login.data?.empresa_id) {
      return NextResponse.json(login.data);
    }

    const companies = await proxyCompanies(email).catch(() => null);
    const firstCompany =
      companies?.ok && Array.isArray(companies.data?.empresas)
        ? companies.data.empresas[0]
        : null;

    if (login?.ok && login.data && firstCompany) {
      return NextResponse.json({
        ...login.data,
        empresa_id:
          login.data?.empresa_id ||
          firstCompany?.id ||
          firstCompany?.empresa_id ||
          firstCompany?.company_id ||
          null,
        nome_empresa:
          login.data?.nome_empresa ||
          firstCompany?.nome ||
          firstCompany?.nome_empresa ||
          firstCompany?.name ||
          "Minha Empresa",
      });
    }

    // 2) Fallback local no Supabase
    const supabase = await createClient();
    const admin = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({
        nome: email.split("@")[0],
        email,
        empresa_id:
          firstCompany?.id ||
          firstCompany?.empresa_id ||
          firstCompany?.company_id ||
          null,
        nome_empresa:
          firstCompany?.nome ||
          firstCompany?.nome_empresa ||
          firstCompany?.name ||
          "Minha Empresa",
        role: "dono",
        plano: "basico",
        permissoes: [],
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || null;
    const userMeta = user?.user_metadata || {};

    const db = admin ?? supabase;

    let membership: Record<string, any> | null = null;
    let company: Record<string, any> | null = null;

    if (userId) {
      const { data } = await db
        .from("company_users")
        .select("id, company_id, role, status")
        .eq("user_id", userId)
        .in("status", ["ativo", "convidado", "active", "pending"])
        .limit(1)
        .maybeSingle();

      membership = (data as Record<string, any> | null) ?? null;
    }

    const companyId =
      String(
        membership?.company_id ||
          userMeta?.empresa_id ||
          firstCompany?.id ||
          firstCompany?.empresa_id ||
          firstCompany?.company_id ||
          ""
      ).trim() || null;

    if (companyId) {
      const { data } = await db
        .from("companies")
        .select("id, name, razao_social, cnpj, plano")
        .eq("id", companyId)
        .maybeSingle();

      company = (data as Record<string, any> | null) ?? null;
    }

    const role = normalizeRole(
      membership?.role || userMeta?.nivel_acesso || login?.data?.role || "dono"
    );

    const plano = normalizePlan(
      company?.plano || userMeta?.plano || login?.data?.plano || "basico"
    );

    const permissoes =
      role === "dono"
        ? ["*"]
        : Array.isArray(login?.data?.permissoes)
        ? login?.data?.permissoes
        : [];

    return NextResponse.json({
      nome:
        String(userMeta?.nome || user?.email?.split("@")[0] || email.split("@")[0]).trim(),
      email,
      empresa_id: companyId,
      nome_empresa:
        String(
          company?.name ||
            userMeta?.nome_empresa ||
            firstCompany?.nome ||
            firstCompany?.nome_empresa ||
            firstCompany?.name ||
            "Minha Empresa"
        ).trim(),
      role,
      plano,
      permissoes,
      company: companyId
        ? {
            id: companyId,
            name: company?.name || null,
            cnpj: company?.cnpj || null,
            plano,
          }
        : null,
      membership: membership
        ? {
            company_id: membership.company_id || null,
            role: membership.role || null,
            status: membership.status || null,
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha ao carregar perfil", details: e?.message || null },
      { status: 500 }
    );
  }
}

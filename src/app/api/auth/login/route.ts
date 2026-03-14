import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email ausente" }, { status: 400 });
    }

    const login = await proxyWorker(email).catch(() => null);
    if (login?.ok && login.data) {
      return NextResponse.json(login.data);
    }

    const companies = await proxyCompanies(email).catch(() => null);
    const firstCompany =
      companies?.ok && Array.isArray(companies.data?.empresas)
        ? companies.data.empresas[0]
        : null;

    return NextResponse.json({
      nome: email.split("@")[0],
      email,
      empresa_id:
        login?.data?.empresa_id ||
        firstCompany?.id ||
        firstCompany?.empresa_id ||
        firstCompany?.company_id ||
        null,
      nome_empresa:
        firstCompany?.nome ||
        firstCompany?.nome_empresa ||
        firstCompany?.name ||
        "Minha Empresa",
      role: login?.data?.role || "dono",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha ao carregar perfil", details: e?.message || null },
      { status: 500 }
    );
  }
}

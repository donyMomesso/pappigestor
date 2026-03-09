// src/lib/api.ts
type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

function getEmpresaId(): string {
  // padrão novo
  const empresaId = localStorage.getItem("empresa_id")?.trim();
  if (empresaId) return empresaId;

  // fallback antigo (se ainda existir)
  const legacy = localStorage.getItem("pId")?.trim();
  return legacy || "";
}

function getUserEmail(): string {
  // se você já grava em algum lugar, tenta usar
  const email =
    localStorage.getItem("user_email")?.trim().toLowerCase() ||
    localStorage.getItem("email")?.trim().toLowerCase() ||
    "";

  return email;
}

// ✅ API BASE: em produção usa /api (mesmo domínio).
// Se você usa Worker local em localhost:8787, troque por "http://localhost:8787"
const API_BASE = "";

type ApiOptions = {
  method?: ApiMethod;
  body?: any;
  headers?: Record<string, string>;
  // se true, não exige empresa/email (ex: /api/empresas/minhas)
  publicRoute?: boolean;
};

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method || "GET";
  const headers: Record<string, string> = {
    ...(opts.headers || {}),
  };

  if (!opts.publicRoute) {
    const empresaId = getEmpresaId();
    const userEmail = getUserEmail();

    if (!empresaId) {
      throw new Error("empresa_id não encontrado no navegador (localStorage.empresa_id).");
    }
    if (!userEmail) {
      throw new Error("user_email não encontrado no navegador (localStorage.user_email).");
    }

    headers["x-empresa-id"] = empresaId;

    // ✅ Worker espera isso
    headers["x-user-email"] = userEmail;

    // fallback temporário (se algum endpoint ainda lê isso)
    headers["x-empresa-id"] = empresaId;
  }

  let body: string | undefined = undefined;

  if (opts.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = headers["Content-Type"].includes("application/json")
      ? JSON.stringify(opts.body)
      : String(opts.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${method} ${path} -> ${res.status}: ${text || "erro"}`);
  }

  // tenta json, senão retorna texto
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json().catch(() => ({}))) as T;
  }
  return (await res.text().catch(() => "")) as T;
}

// Helper específico para a rota pública de empresas
export async function apiPublic<T = any>(path: string, opts: Omit<ApiOptions, "publicRoute"> = {}) {
  return api<T>(path, { ...opts, publicRoute: true });
}
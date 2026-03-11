// src/lib/api.ts
import { getSession } from "next-auth/react";

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ApiOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  publicRoute?: boolean;
};

type AppSessionUser = {
  email?: string | null;
  empresaId?: string | null;
  empresa_id?: string | null;
  role?: string | null;
  name?: string | null;
};

async function getAuthData() {
  const session = await getSession();
  const user = (session?.user ?? {}) as AppSessionUser;

  const empresaId = user.empresaId || user.empresa_id || "";
  const userEmail = user.email?.trim().toLowerCase() || "";

  return {
    session,
    empresaId,
    userEmail,
  };
}

const API_BASE = "";

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {}
): Promise<T> {
  const method = opts.method || "GET";
  const headers: Record<string, string> = {
    ...(opts.headers || {}),
  };

  if (!opts.publicRoute) {
    const { session, empresaId, userEmail } = await getAuthData();

    if (!session) {
      throw new Error("Sessão não encontrada. Faça login novamente.");
    }

    if (!empresaId) {
      throw new Error("empresaId não encontrado na sessão do NextAuth.");
    }

    if (!userEmail) {
      throw new Error("email não encontrado na sessão do NextAuth.");
    }

    headers["x-empresa-id"] = empresaId;
    headers["x-user-email"] = userEmail;
  }

  let body: BodyInit | undefined;

  if (opts.body !== undefined) {
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else if (typeof opts.body === "string") {
      headers["Content-Type"] = headers["Content-Type"] || "text/plain";
      body = opts.body;
    } else {
      headers["Content-Type"] =
        headers["Content-Type"] || "application/json";
      body = JSON.stringify(opts.body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
  });

  if (!res.ok) {
    let message = `API ${method} ${path} -> ${res.status}`;

    try {
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const json = await res.json();
        message = json?.error || json?.message || message;
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch {}

    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}

export async function apiPublic<T = unknown>(
  path: string,
  opts: Omit<ApiOptions, "publicRoute"> = {}
): Promise<T> {
  return api<T>(path, { ...opts, publicRoute: true });
}
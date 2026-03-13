import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseFromRequest(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        // no-op em route handlers GET/POST simples
      },
    },
  });
}

export function parseEmpresaId(req: NextRequest): string | null {
  const empresaId =
    req.headers.get("x-empresa-id") ||
    req.headers.get("x-pizzaria-id") ||
    req.nextUrl.searchParams.get("empresa_id") ||
    req.nextUrl.searchParams.get("pizzaria_id");

  return empresaId?.trim() || null;
}

type UsuarioEmpresaRow = {
  empresa_id?: string | null;
  pizzaria_id?: string | null;
};

export async function resolveEmpresaId(req: NextRequest): Promise<string | null> {
  const direct = parseEmpresaId(req);
  if (direct) return direct;

  try {
    const supabaseAuth = getSupabaseFromRequest(req);
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user?.id) return null;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: usuarioRow } = await supabaseAdmin
      .from("usuarios")
      .select("empresa_id, pizzaria_id")
      .eq("id", user.id)
      .maybeSingle<UsuarioEmpresaRow>();

    if (usuarioRow?.empresa_id) return usuarioRow.empresa_id;
    if (usuarioRow?.pizzaria_id) return usuarioRow.pizzaria_id;

    const { data: vinculoRow } = await supabaseAdmin
      .from("usuarios_empresa")
      .select("empresa_id")
      .eq("usuario_id", user.id)
      .maybeSingle<UsuarioEmpresaRow>();

    if (vinculoRow?.empresa_id) return vinculoRow.empresa_id;
  } catch {
    // ignora fallback sem auth
  }

  return null;
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function normalizeId(value: unknown): string | number {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return /^\d+$/.test(text) ? Number(text) : text;
}

export async function trySelectByEmpresa(
  table: string,
  select = "*",
  empresaId?: string | null
) {
  const supabase = getSupabaseAdmin();
  const scopes = ["empresa_id", "pizzaria_id"];

  for (const scope of scopes) {
    const query = supabase.from(table).select(select);
    const result = empresaId ? await query.eq(scope, empresaId) : await query;
    if (!result.error) return result;
    if (!/column .* does not exist|Could not find the '.+' column/i.test(result.error.message)) {
      return result;
    }
  }

  return supabase.from(table).select(select);
}

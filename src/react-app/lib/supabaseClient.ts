// src/lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Retorna o client do Supabase no browser.
 * - Não quebra build/SSR
 * - Retorna null se ENV não estiver configurada
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const isValidUrl = /^https?:\/\/.+/i.test(url);
  if (!isValidUrl || !key) return null;

  if (!_client) _client = createBrowserClient(url, key);
  return _client;
}

// ✅ Alias para compatibilidade com códigos que importam getSupabase()
export const getSupabase = getSupabaseClient;

// ✅ Mantém compatibilidade com códigos antigos que importam `supabase`
export const supabase = getSupabaseClient();
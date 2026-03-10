"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

export async function requireUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function getMyCompanyId() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const user = await requireUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data?.company_id as string) ?? null;
}

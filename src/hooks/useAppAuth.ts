"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type NivelAcesso =
  | "operador"
  | "comprador"
  | "financeiro"
  | "admin_empresa"
  | "super_admin";

export type LocalUser = {
  id: string;
  nome: string;
  email: string;
  nivel_acesso: NivelAcesso;
  empresa_id: string;
  empresa_nome: string;
  features: string[];
};

/**
 * Normaliza qualquer role antiga para o novo padrão SaaS
 */
function normalizeRole(role: any): NivelAcesso {
  const r = String(role ?? "").toLowerCase().trim();

  if (r === "super_admin") return "super_admin";
  if (r === "admin_empresa" || r === "admin") return "admin_empresa";
  if (r === "financeiro") return "financeiro";
  if (r === "comprador") return "comprador";

  return "operador";
}

const ROLE_PRIORITY: Record<NivelAcesso, number> = {
  operador: 1,
  comprador: 2,
  financeiro: 3,
  admin_empresa: 4,
  super_admin: 5,
};

export function useAppAuth() {
  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  const hasPermission = (roles: string[]) => {
    if (!localUser) return false;
    return roles.includes(localUser.nivel_acesso);
  };

  const hasFeature = (feature: string) => {
    if (!localUser) return false;
    return localUser.features.includes(feature);
  };

  const canAtLeast = (minRole: NivelAcesso) => {
    if (!localUser) return false;
    return ROLE_PRIORITY[localUser.nivel_acesso] >= ROLE_PRIORITY[minRole];
  };

  async function reload() {
    setLoading(true);

    try {
      const { data: sessionData, error: sessErr } =
        await supabase.auth.getSession();

      if (sessErr) throw sessErr;

      const session = sessionData.session;

      if (!session?.user) {
        setLocalUser(null);
        return;
      }

      const user = session.user;
      const userId = user.id;

      // Busca vínculo empresa
      const { data: link, error: linkErr } = await supabase
        .from("company_users")
        .select("company_id, role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (linkErr) {
        console.error("company_users error:", linkErr);
        setLocalUser(null);
        return;
      }

      if (!link?.company_id) {
        // usuário ainda não tem empresa
        setLocalUser({
          id: userId,
          nome:
            (user.user_metadata?.full_name as string) ?? "Usuário",
          email: user.email ?? "",
          nivel_acesso: "operador",
          empresa_id: "",
          empresa_nome: "",
          features: [],
        });
        return;
      }

      const companyId = link.company_id as string;
      const role = normalizeRole(link.role);

      // Nome da empresa
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .maybeSingle();

      // Features da empresa
      const { data: feats } = await supabase
        .from("company_features")
        .select("feature, enabled")
        .eq("company_id", companyId);

      const features = (feats ?? [])
        .filter((f: any) => !!f.enabled)
        .map((f: any) => f.feature as string);

      setLocalUser({
        id: userId,
        nome:
          (user.user_metadata?.full_name as string) ?? "Usuário",
        email: user.email ?? "",
        nivel_acesso: role,
        empresa_id: companyId,
        empresa_nome: company?.name ?? "",
        features,
      });
    } catch (err) {
      console.error("useAppAuth fatal:", err);
      setLocalUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    const { data: sub } =
      supabase.auth.onAuthStateChange(() => reload());

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    localUser,
    hasPermission,
    hasFeature,
    canAtLeast,
    reload,
  };
}
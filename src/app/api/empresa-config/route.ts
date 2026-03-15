import { NextResponse } from "next/server";
import { getEmpresaId, getSupabase, numberOrNull } from "../_financeiro/helpers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const [{ data: empresa, error: empresaError }, { data: config, error: configError }] =
      await Promise.all([
        supabase
          .from("companies")
          .select("id, name, plano, status, cnpj")
          .eq("id", empresaId)
          .maybeSingle(),
        supabase
          .from("empresa_config")
          .select("*")
          .eq("empresa_id", empresaId)
          .maybeSingle(),
      ]);

    if (empresaError) {
      return NextResponse.json(
        { error: empresaError.message },
        { status: 500 }
      );
    }

    if (configError && !/relation .* does not exist/i.test(configError.message)) {
      return NextResponse.json(
        { error: configError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      empresa: empresa
        ? {
            id: empresa.id,
            name: empresa.name ?? "",
            plano: empresa.plano ?? "basico",
            status: empresa.status ?? "ativa",
            cnpj: empresa.cnpj ?? null,
          }
        : {
            id: empresaId,
            name: "",
            plano: "basico",
            status: "ativa",
            cnpj: null,
          },
      config: config ?? {
        empresa_id: empresaId,
        limite_aprovacao_pagamento: 1000,
        whatsapp_admin: "",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar empresa-config" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const empresaId = getEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const supabase = getSupabase();

    const limite = numberOrNull(body.limite_aprovacao_pagamento);

    const configPayload = {
      empresa_id: empresaId,
      limite_aprovacao_pagamento: limite ?? 0,
      whatsapp_admin: String(body.whatsapp_admin || ""),
      updated_at: new Date().toISOString(),
    };

    const empresaPayload: Record<string, any> = {};

    if (body.name !== undefined) {
      empresaPayload.name = String(body.name || "").trim();
    }

    if (body.plano !== undefined) {
      empresaPayload.plano = String(body.plano || "basico").trim();
    }

    if (body.status !== undefined) {
      empresaPayload.status = String(body.status || "ativa").trim();
    }

    if (body.cnpj !== undefined) {
      empresaPayload.cnpj = String(body.cnpj || "").trim() || null;
    }

    const [{ data: config, error: configError }, empresaResult] = await Promise.all([
      supabase
        .from("empresa_config")
        .upsert(configPayload, { onConflict: "empresa_id" })
        .select("*")
        .single(),
      Object.keys(empresaPayload).length
        ? supabase
            .from("companies")
            .update(empresaPayload)
            .eq("id", empresaId)
            .select("id, name, plano, status, cnpj")
            .single()
        : supabase
            .from("companies")
            .select("id, name, plano, status, cnpj")
            .eq("id", empresaId)
            .single(),
    ]);

    if (configError) {
      return NextResponse.json(
        { error: configError.message },
        { status: 500 }
      );
    }

    if (empresaResult.error) {
      return NextResponse.json(
        { error: empresaResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      empresa: empresaResult.data,
      config,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro ao salvar empresa-config" },
      { status: 500 }
    );
  }
}

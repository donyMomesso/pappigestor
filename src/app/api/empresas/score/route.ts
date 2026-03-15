import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin client não disponível" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get("empresa");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresa obrigatória" },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("company_scores")
      .select("*")
      .eq("company_id", empresaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      data ?? {
        company_id: empresaId,
        score_total: 0,
        score_financeiro: 0,
        score_estoque: 0,
        score_compras: 0,
        score_organizacao: 0,
        updated_at: null,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar score da empresa" },
      { status: 500 }
    );
  }
}
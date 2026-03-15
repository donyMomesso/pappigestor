import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin client não disponível" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const company_id = String(body?.company_id || "").trim();
    const user_id = String(body?.user_id || "").trim();
    const role = String(body?.role || "operador").trim();

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id obrigatório" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("company_users")
      .insert({
        company_id,
        user_id,
        role,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao associar usuário à empresa" },
      { status: 500 }
    );
  }
}
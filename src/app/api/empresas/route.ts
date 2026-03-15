import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin client não disponível" },
        { status: 500 }
      );
    }

    const { data, error } = await admin
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao listar empresas" },
      { status: 500 }
    );
  }
}

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

    const payload = {
      name: String(body?.name || "").trim(),
      cnpj: body?.cnpj ? String(body.cnpj).trim() : null,
      plano: body?.plano ? String(body.plano).trim() : "basico",
      status: body?.status ? String(body.status).trim() : "ativa",
    };

    if (!payload.name) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("companies")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}

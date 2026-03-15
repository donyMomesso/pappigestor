import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const admin = getSupabaseAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin client não disponível" },
        { status: 500 }
      );
    }

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
      .update(payload)
      .eq("id", id)
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
      { error: error?.message || "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const admin = getSupabaseAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin client não disponível" },
        { status: 500 }
      );
    }

    const { error } = await admin
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao excluir empresa" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { HOME_PAGE_KEY, normalizeShortcutIds } from "@/lib/home-preferences";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Supabase não configurado");
  }

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("user_home_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("page_key", HOME_PAGE_KEY)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      preference: data
        ? {
            ...data,
            quick_shortcuts: normalizeShortcutIds(data.quick_shortcuts),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const userId = typeof body?.userId === "string" ? body.userId : "";
    const empresaId =
      typeof body?.empresaId === "string" && body.empresaId.trim().length > 0
        ? body.empresaId
        : null;

    const quickShortcuts = normalizeShortcutIds(body?.quickShortcuts);

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const payload = {
      user_id: userId,
      empresa_id: empresaId,
      page_key: HOME_PAGE_KEY,
      quick_shortcuts: quickShortcuts,
    };

    const { data, error } = await supabase
      .from("user_home_preferences")
      .upsert(payload, {
        onConflict: "user_id,page_key",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      preference: {
        ...data,
        quick_shortcuts: normalizeShortcutIds(data.quick_shortcuts),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
// src/app/api/auth/callback/route.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // cookies são tratados pelo middleware
          }
        },
      },
    }
  );

  // Troca o código pela sessão
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.user) {
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  const email = data.user.email;

  try {
    // Chama sua API para obter perfil normalizado
    const response = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const profile = await response.json();

    if (!profile?.empresa_id) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Redireciona para sync-session para salvar no localStorage
    const redirectUrl = new URL(`${origin}/app/sync-session`);
    redirectUrl.searchParams.set("pId", profile.empresa_id);
    redirectUrl.searchParams.set("role", profile.role || "operador");
    redirectUrl.searchParams.set("next", next);

    return NextResponse.redirect(redirectUrl.toString());
  } catch {
    return NextResponse.redirect(`${origin}/login?error=sync_failed`);
  }
}
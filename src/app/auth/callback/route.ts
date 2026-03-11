// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface UserProfile {
  pizzaria_id?: string;
  role?: string;
  nome?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/app/dashboard";
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[auth-callback] Missing Supabase env vars");
    return NextResponse.redirect(`${origin}/login?error=server_config`);
  }

  // await + cast any para compatibilidade com diferentes versões/types do Next
  const cookieStore = (await cookies()) as any;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        // cookieStore.getAll pode existir em algumas versões; fallback para []
        return typeof cookieStore.getAll === "function" ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              // cookieStore.set pode aceitar objeto ou (name, value)
              if (typeof cookieStore.set === "function") {
                // preferir o formato objeto quando disponível
                try {
                  cookieStore.set({
                    name,
                    value,
                    ...(options as any),
                  });
                } catch {
                  // fallback para assinatura (name, value)
                  try {
                    cookieStore.set(name, value);
                  } catch {
                    // swallow
                  }
                }
              }
            } catch {
              // swallow
            }
          });
        } catch (error) {
          console.warn("[auth-callback] setAll cookies failed", error);
        }
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.user) {
      console.warn("[auth-callback] exchangeCodeForSession failed", error);
      return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
    }

    const email = data.user.email;
    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
    }

    try {
      const response = await fetch(`${origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.warn("[auth-callback] /api/auth/login returned non-ok", response.status);
        return NextResponse.redirect(`${origin}/login?error=sync_failed`);
      }

      const profile = (await response.json()) as UserProfile;

      if (!profile?.pizzaria_id) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      const redirectUrl = new URL(`${origin}/app/sync-session`);
      redirectUrl.searchParams.set("pId", profile.pizzaria_id);
      redirectUrl.searchParams.set("role", profile.role ?? "comum");
      redirectUrl.searchParams.set("next", nextPath);

      return NextResponse.redirect(redirectUrl.toString());
    } catch (err) {
      console.error("[auth-callback] sync request failed", err);
      return NextResponse.redirect(`${origin}/login?error=sync_failed`);
    }
  } catch (err) {
    console.error("[auth-callback] unexpected error", err);
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
  }
}
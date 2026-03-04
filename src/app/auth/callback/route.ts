import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Interface para os dados do seu banco
interface UserProfile {
  pizzaria_id?: string;
  role?: string;
  nome?: string;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          // ✅ Tipagem explícita adicionada aqui para matar o erro "any"
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Middleware trata cookies em rotas protegidas
            }
          },
        },
      }
    )

    // Troca o código pela sessão
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      const email = data.user.email;

      try {
        // Chamada ao seu Worker (Pappi API)
        const response = await fetch(`${origin}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const profile = (await response.json()) as UserProfile;

        // Se o usuário não existe no seu D1/Supabase, vai para onboarding
        if (!profile.pizzaria_id) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Se existe, vai sincronizar a sessão no LocalStorage
        const redirectUrl = new URL(`${origin}/app/sync-session`);
        redirectUrl.searchParams.set('pId', profile.pizzaria_id);
        redirectUrl.searchParams.set('role', profile.role || 'comum');
        redirectUrl.searchParams.set('next', next);
        
        return NextResponse.redirect(redirectUrl.toString());

      } catch (err) {
        return NextResponse.redirect(`${origin}/login?error=sync_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}

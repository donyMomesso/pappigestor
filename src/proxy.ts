import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = {
  name: string;
  value: string;
  // NextResponse.cookies.set aceita um objeto de opções; tipamos como unknown
  // para evitar 'any' implícito sem travar o build.
  options?: unknown;
};

// No Next.js 16, a função de interceptação agora deve se chamar 'proxy'
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => 
            // @ts-expect-error - a tipagem de cookies no Next pode variar por versão
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Segurança de Borda (Edge)
  const { data: { user } } = await supabase.auth.getUser()

  // --- LÓGICA DE REDIRECIONAMENTO SAAS ---

  // 1. Já logado? Não precisa ver a tela de login.
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // 2. Tentando entrar no App sem login? De volta para o início.
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

// Configuração de rotas protegidas
export const config = {
  matcher: [
    '/app/:path*', 
    '/login',
    '/onboarding',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
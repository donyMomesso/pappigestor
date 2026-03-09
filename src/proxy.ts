// Caminho: src/proxy.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ✅ FUNÇÃO RENOMEADA DE 'middleware' PARA 'proxy'
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Se o usuário está logado e tenta acessar a página de login, redireciona para o app
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Se o usuário não está logado e tenta acessar uma página protegida, redireciona para o login
  if (!user && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

// A configuração do matcher continua a mesma, já está correta
// No seu arquivo src/middleware.ts

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto os que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (ícone do site)
     * - manifest.json (manifesto da PWA)
     * - .*\\.png (todas as imagens PNG)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$).*)',
  ],
}

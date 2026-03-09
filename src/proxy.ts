// Caminho: src/middleware.ts ou middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

// ✅ CONFIGURAÇÃO CORRIGIDA E OTIMIZADA
export const config = {
  /*
   * O matcher agora executa o middleware em TODAS as rotas, EXCETO nas que são:
   * - Rotas de API (/api)
   * - Arquivos estáticos do Next.js (/_next/static)
   * - Otimização de imagem do Next.js (/_next/image)
   * - favicon.ico
   * - Qualquer outro caminho que contenha um ponto (.), o que efetivamente ignora
   *   todos os arquivos como .png, .jpg, .svg, manifest.json, etc.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

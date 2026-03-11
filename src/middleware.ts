// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as { empresa_id?: string; role?: string } | null;

    // Se já está logado e tenta acessar /login, redireciona para /app/dashboard
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }

    // Se não está logado ou não tem empresa vinculada, bloqueia acesso a /app/*
    if ((!token || !token.empresa_id) && pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Só autoriza se houver token e empresa_id
      authorized: ({ token }) => {
        return !!token && !!(token as any).empresa_id;
      },
    },
  }
);

export const config = {
  matcher: [
    "/login",
    "/app/:path*",
  ],
};
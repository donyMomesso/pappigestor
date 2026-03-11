// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;
    const token = (req as any).nextauth?.token as { empresa_id?: string } | null;

    // Permitir NextAuth e assets sem validação
    if (
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.startsWith("/favicon")
    ) {
      return NextResponse.next();
    }

    // Redirecionamentos e proteção de /app
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }
    if ((!token || !token.empresa_id) && pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/api/auth")) return true;
        return !!token && !!(token as any).empresa_id;
      },
    },
  }
);

export const config = {
  matcher: ["/login", "/app/:path*"],
};
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As rotas /api do Next devem permanecer locais.
  // O projeto já possui route handlers em src/app/api/*.
  // Rewrites globais para /api quebravam o NextAuth,
  // mandando /api/auth/* para o Worker.
};

export default nextConfig;

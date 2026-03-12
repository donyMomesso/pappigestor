import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Intercepta tudo o que o frontend mandar para /api/
        source: '/api/:path*',
        
        // Redireciona magicamente para o Worker (Local ou Produção)
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://127.0.0.1:8787/api/:path*' 
          : 'https://pappi-worker.pappigestor.workers.dev/api/:path*',
      },
    ];
  },
};

export default nextConfig;
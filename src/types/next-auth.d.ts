// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      empresa_id?: string;
      role?: string;
    };
  }

  interface User {
    empresa_id?: string;
    role?: string;
  }

  interface JWT {
    empresa_id?: string;
    role?: string;
  }
}
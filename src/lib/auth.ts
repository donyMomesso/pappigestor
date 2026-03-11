// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      const email =
        typeof profile === "object" &&
        profile !== null &&
        "email" in profile &&
        typeof profile.email === "string"
          ? profile.email
          : token.email;

      if (account && email && process.env.NEXTAUTH_URL) {
        try {
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (res.ok) {
            const data = (await res.json()) as {
              empresa_id?: string;
              role?: string;
            };

            token.empresa_id = data.empresa_id;
            token.role = data.role ?? "operador";
          } else {
            token.role = "operador";
          }
        } catch (error) {
          console.error("Erro ao buscar dados extras do usuário:", error);
          token.role = "operador";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { empresa_id?: string }).empresa_id =
          typeof token.empresa_id === "string" ? token.empresa_id : undefined;

        (session.user as { role?: string }).role =
          typeof token.role === "string" ? token.role : undefined;
      }

      return session;
    },
  },
};
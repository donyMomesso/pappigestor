// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
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
  debug: true, // ativa logs para depuração
  callbacks: {
    // jwt callback resiliente: não quebra o fluxo se /api/auth/login falhar
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        try {
          const url = `${process.env.NEXTAUTH_URL}/api/auth/login`;
          console.log("[NextAuth][jwt] calling:", url, "email:", profile.email);

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token.empresa_id) headers["x-empresa-id"] = String(token.empresa_id);

          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ email: profile.email }),
          });

          console.log("[NextAuth][jwt] /api/auth/login status:", res.status);

          if (res.ok) {
            const data = await res.json();
            console.log("[NextAuth][jwt] /api/auth/login body:", data);
            // só atribui se vier
            if (data?.empresa_id) token.empresa_id = data.empresa_id;
            if (data?.role) token.role = data.role;
          } else {
            const text = await res.text();
            console.warn("[NextAuth][jwt] /api/auth/login non-ok:", res.status, text);
          }
        } catch (err) {
          console.error("[NextAuth][jwt] fetch error:", err);
        }
      }
      return token;
    },

    // session callback: copia campos do token para a session
    async session({ session, token }) {
      if (session.user) {
        // tipagem permissiva para evitar erros se token não tiver campos
        (session.user as any).empresa_id = (token as any).empresa_id;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
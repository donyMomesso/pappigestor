// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
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
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret",
  debug: true,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      try {
        // roda no login inicial
        if (account) {
          const email =
            user?.email?.trim().toLowerCase() ||
            profile?.email?.trim().toLowerCase() ||
            String(token.email ?? "").trim().toLowerCase();

          if (!email) {
            console.warn("[NextAuth][jwt] email ausente no login");
            return token;
          }

          // IMPORTANTE:
          // NÃO use /api/auth/login porque isso conflita com [...nextauth]
          const baseUrl =
            process.env.NEXTAUTH_URL ?? "http://localhost:3000";

          const res = await fetch(`${baseUrl}/api/app-auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (res.ok) {
            const data = await res.json().catch(() => ({}));

            if (data?.empresa_id) {
              (token as any).empresa_id = String(data.empresa_id);
            }

            if (data?.role) {
              (token as any).role = String(data.role);
            }

            if (data?.nome) {
              token.name = String(data.nome);
            }
          } else {
            const text = await res.text().catch(() => "");
            console.warn(
              "[NextAuth][jwt] /api/app-auth/login non-ok:",
              res.status,
              text
            );
          }
        }
      } catch (err) {
        console.error("[NextAuth][jwt] fetch error:", err);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).empresa_id = (token as any).empresa_id ?? null;
        (session.user as any).empresaId = (token as any).empresa_id ?? null;
        (session.user as any).role = (token as any).role ?? null;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
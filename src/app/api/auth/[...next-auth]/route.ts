import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        // Chama sua API para buscar dados extras
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: profile.email }),
        });

        // Tipar retorno da API
        const data: { empresa_id?: string; role?: string } = await res.json();

        token.empresa_id = data.empresa_id;
        token.role = data.role ?? "operador";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.empresa_id = token.empresa_id as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
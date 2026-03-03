import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppAuthProvider } from "../react-app/contexts/AppAuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pappi Gestor | Inteligência Artificial para seu Negócio e Lar",
  description:
    "Automatize compras, controle estoque e gerencie seu lucro com a IA do Pappi Gestor. Ideal para comércios e organização doméstica inteligente.",
  keywords: [
    "gestão de estoque",
    "inteligência artificial",
    "automação comercial",
    "pizzaria",
    "campinas",
    "SaaS",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-white`}
      >
        <AppAuthProvider>{children}</AppAuthProvider>
      </body>
    </html>
  );
}
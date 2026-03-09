import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Pappi Gestor",
    template: "%s | Pappi Gestor",
  },
  description:
    "Gestão inteligente com IA para compras, estoque, financeiro e operação de food service.",
  applicationName: "Pappi Gestor",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-gray-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
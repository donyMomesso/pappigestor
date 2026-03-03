import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "PappiGestor",
    template: "%s | PappiGestor",
  },
  description: "Gestão inteligente com IA para compras, estoque e financeiro.",
  applicationName: "PappiGestor",
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
    <html lang="pt-br" suppressHydrationWarning>
      <body className="min-h-dvh bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

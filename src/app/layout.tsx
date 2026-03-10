import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Pappi Gestor",
  description: "ERP inteligente para food service",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <main className="container-pappi custom-scrollbar">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
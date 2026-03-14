import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["600", "700"],
  display: "swap",
});

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
      <body
        className={`${inter.variable} ${poppins.variable} min-h-dvh bg-[#f7f7f8] text-[#2A2A2A] antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

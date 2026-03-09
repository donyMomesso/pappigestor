"use client";

import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Removido o AppAuthProvider antigo que estava quebrando o build
  // Se você tiver outros provedores (como QueryClient ou ThemeProvider), mantenha-os aqui
  return (
    <>
      {children}
    </>
  );
}

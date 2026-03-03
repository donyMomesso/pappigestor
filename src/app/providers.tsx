"use client";

import { ReactNode } from "react";
import { AppAuthProvider } from "@/react-app/contexts/AppAuthContext";

/**
 * Este componente envolve a aplicação com todos os contextos necessários.
 * Ele deve ser um Client Component ("use client") para suportar o Context API.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppAuthProvider>
      {children}
    </AppAuthProvider>
  );
}
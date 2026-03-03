"use client"; // Esta linha é a chave!

import { AuthProvider as MochaProvider } from "@getmocha/users-service/react";
import { AppAuthProvider } from "@/react-app/contexts/AppAuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MochaProvider>
      <AppAuthProvider>
        {children}
      </AppAuthProvider>
    </MochaProvider>
  );
}
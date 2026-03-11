"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AppAuthProvider } from "@/contexts/AppAuthContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AppAuthProvider>{children}</AppAuthProvider>
    </SessionProvider>
  );
}
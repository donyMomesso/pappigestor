"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AppAuthProvider } from "@/contexts/AppAuthContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppAuthProvider>{children}</AppAuthProvider>
    </SessionProvider>
  );
}

"use client";

import { AppAuthProvider } from "@/contexts/AppAuthContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppAuthProvider>
      {children}
    </AppAuthProvider>
  );
}

"use client";

import { AppAuthProvider } from "@/react-app/contexts/AppAuthContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppAuthProvider>
      {children}
    </AppAuthProvider>
  );
}

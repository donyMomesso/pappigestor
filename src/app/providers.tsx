"use client";

import type { ReactNode } from "react";
import { AppAuthProvider } from "@/react-app/contexts/AppAuthContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <AppAuthProvider>{children}</AppAuthProvider>;
}
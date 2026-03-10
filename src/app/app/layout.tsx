"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AppAuthProvider, useAppAuth } from "@/contexts/AppAuthContext";

function ProtectedShell({ children }: { children: ReactNode }) {
  const { loading } = useAppAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthProvider>
      <ProtectedShell>{children}</ProtectedShell>
    </AppAuthProvider>
  );
}
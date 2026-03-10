"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { NivelAcesso } from "@/types/auth"; // Verifique se este caminho existe exatamente assim
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: NivelAcesso[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { localUser, hasRole, isLoading } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && localUser && !hasRole(allowedRoles)) {
      router.replace("/app");
    }
  }, [isLoading, localUser, hasRole, allowedRoles, router]);

  if (isLoading || !localUser || !hasRole(allowedRoles)) return null;

  return <>{children}</>;
}
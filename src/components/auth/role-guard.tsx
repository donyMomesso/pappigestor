"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import type { NivelAcesso } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: NivelAcesso[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { localUser, isLoading } = useAppAuth();
  const router = useRouter();

  const userRole = localUser?.role;

  const hasAccess =
    !!localUser &&
    !!userRole &&
    allowedRoles.includes(userRole as NivelAcesso);

  useEffect(() => {
    if (isLoading) return;

    if (localUser && !hasAccess) {
      router.replace("/app");
    }
  }, [isLoading, localUser, hasAccess, router]);

  if (isLoading) return null;

  if (localUser && !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
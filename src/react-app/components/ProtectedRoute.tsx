"use client";

import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Navigate } from "react-router";

export default function ProtectedRoute({
  children,
  allowedRoles,
  skipSubscriptionCheck,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  skipSubscriptionCheck?: boolean;
}) {
  const { localUser, loading } = useAppAuth();

  if (loading) return null;

  if (!localUser) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    localUser.nivel_acesso &&
    !allowedRoles.includes(localUser.nivel_acesso)
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
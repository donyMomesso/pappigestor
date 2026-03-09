"use client";

import React from "react";
import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams, useParams as useNextParams } from "next/navigation";

type LinkProps = React.ComponentProps<typeof NextLink> & { to?: string };

export function Link(props: any) {
  const { to, href, ...rest } = props as LinkProps & { href?: string };
  const finalHref = (to ?? href ?? "/") as string;
  return <NextLink href={finalHref} {...rest} />;
}

export function useLocation() {
  const pathname = usePathname() || "/";
  const sp = useSearchParams();
  const search = sp?.toString() ? `?${sp.toString()}` : "";
  return { pathname, search, hash: "", state: null, key: "next" };
}

export function useNavigate() {
  const router = useRouter();
  return (to: any, opts?: any) => {
    const url = typeof to === "string" ? to : String((to as any)?.pathname ?? "/");
    if (opts?.replace) router.replace(url);
    else router.push(url);
  };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  React.useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [to, replace, router]);
  return null;
}

// Stubs para compatibilidade com react-router-dom (usados pelo App.tsx SPA)
export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Route(_props: { path?: string; element?: React.ReactNode; children?: React.ReactNode }) {
  return null;
}

export function useParams<T = Record<string, string | undefined>>(): T {
  return (useNextParams() || {}) as T;
}
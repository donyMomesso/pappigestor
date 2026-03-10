"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import TopHeader from "@/components/layout/TopHeader";
import { useAppAuth } from "@/contexts/AppAuthContext";

interface Empresa {
  status_assinatura?: string;
  assinatura_expirada?: boolean;
  subscription_expires_at?: string;
}

interface LocalUser {
  empresaAtual?: Empresa;
  empresa?: Empresa;
  // outras props do usuário...
}

interface AppAuthContext {
  localUser: LocalUser | null;
  isLoading: boolean;
}

interface AppLayoutProps {
  children: ReactNode;
}

function FullScreenMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-sm">
          PG
        </div>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-orange-500" />
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { localUser, isLoading } = useAppAuth() as AppAuthContext;

  const subscriptionExpired = useMemo(() => {
    if (!localUser) return false;

    // company agora é explicitamente Empresa
    const company: Empresa | undefined =
      localUser.empresaAtual ?? localUser.empresa;

    const status = company?.status_assinatura?.toLowerCase();

    if (
      company?.assinatura_expirada ||
      ["expired", "inativo", "bloqueado"].includes(status ?? "")
    ) {
      return true;
    }

    const expirationDate = company?.subscription_expires_at;
    if (expirationDate && Date.parse(expirationDate) < Date.now()) {
      return true;
    }

    return false;
  }, [localUser]);

  useEffect(() => {
    if (isLoading) return;

    if (!localUser) {
      router.replace("/login");
      return;
    }

    const isConfiguracoesPage = pathname?.startsWith("/app/configuracoes");
    if (subscriptionExpired && !isConfiguracoesPage) {
      router.replace("/app/configuracoes?tab=assinatura");
    }
  }, [isLoading, localUser, subscriptionExpired, pathname, router]);

  if (isLoading) {
    return (
      <FullScreenMessage
        title="Carregando o Pappi Gestor"
        description="Estamos validando sua sessão, empresa e permissões de acesso."
      />
    );
  }

  if (!localUser) {
    return (
      <FullScreenMessage
        title="Redirecionando para login"
        description="Sua sessão não foi encontrada. Você será levado para a autenticação."
      />
    );
  }

  if (subscriptionExpired && !pathname?.startsWith("/app/configuracoes")) {
    return (
      <FullScreenMessage
        title="Verificando assinatura"
        description="Sua empresa precisa regularizar a assinatura para continuar acessando os módulos internos."
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
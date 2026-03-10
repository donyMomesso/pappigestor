"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, UserCircle2 } from "lucide-react";
import { useAppAuth } from "@/contexts/AppAuthContext";

const titlesMap: Record<string, { title: string; subtitle: string }> = {
  "/app": {
    title: "Visão Geral",
    subtitle: "Acompanhe a operação do Pappi Gestor em tempo real.",
  },
  "/app/dashboard": {
    title: "Dashboard",
    subtitle: "Indicadores estratégicos da operação.",
  },
  "/app/compras": {
    title: "Compras",
    subtitle: "Gerencie pedidos, cotações e decisões de compra.",
  },
  "/app/lista-compras": {
    title: "Lista de Compras",
    subtitle: "Organize as necessidades da operação.",
  },
  "/app/compra-mercado": {
    title: "Compra Mercado",
    subtitle: "Controle compras rápidas e emergenciais.",
  },
  "/app/recebimento": {
    title: "Recebimento",
    subtitle: "Confirme entradas e garanta rastreabilidade.",
  },
  "/app/estoque": {
    title: "Estoque",
    subtitle: "Controle entradas, saídas, perdas e inventário.",
  },
  "/app/produtos": {
    title: "Produtos",
    subtitle: "Cadastre e organize os itens da operação.",
  },
  "/app/fornecedores": {
    title: "Fornecedores",
    subtitle: "Acompanhe parceiros, preços e desempenho.",
  },
  "/app/financeiro": {
    title: "Financeiro",
    subtitle: "Monitore saldo, DDA, contas e previsões.",
  },
  "/app/assessor-ia": {
    title: "Assessor IA",
    subtitle: "Receba alertas, insights e recomendações inteligentes.",
  },
  "/app/configuracoes": {
    title: "Configurações",
    subtitle: "Ajuste empresa, acessos e preferências do sistema.",
  },
};

export default function TopHeader() {
  const pathname = usePathname();
  const { localUser } = useAppAuth();

  const currentPage = useMemo(() => {
    return (
      titlesMap[pathname] ?? {
        title: "Pappi Gestor",
        subtitle: "Gestão inteligente para food service.",
      }
    );
  }, [pathname]);

  const displayName =
    localUser?.nome ||
    localUser?.name ||
    localUser?.email ||
    "Usuário";

  return (
    <header className="border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {currentPage.title}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {currentPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 md:flex dark:border-zinc-800 dark:bg-zinc-900">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar no sistema..."
              className="w-56 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <UserCircle2 className="h-9 w-9 text-orange-500" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {displayName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sessão ativa
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Truck,
  Boxes,
  Bot,
  Settings,
  ClipboardList,
  Store,
  Inbox,
  Building2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/app",
    label: "Início",
    icon: LayoutDashboard,
  },
  {
    href: "/app/dashboard",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/app/compras",
    label: "Compras",
    icon: ShoppingCart,
  },
  {
    href: "/app/lista-compras",
    label: "Lista de Compras",
    icon: ClipboardList,
  },
  {
    href: "/app/compra-mercado",
    label: "Compra Mercado",
    icon: Store,
  },
  {
    href: "/app/recebimento",
    label: "Recebimento",
    icon: Inbox,
  },
  {
    href: "/app/estoque",
    label: "Estoque",
    icon: Package,
  },
  {
    href: "/app/produtos",
    label: "Produtos",
    icon: Boxes,
  },
  {
    href: "/app/fornecedores",
    label: "Fornecedores",
    icon: Truck,
  },
  {
    href: "/app/financeiro",
    label: "Financeiro",
    icon: DollarSign,
  },
  {
    href: "/app/assessor-ia",
    label: "Assessor IA",
    icon: Bot,
  },
  {
    href: "/app/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
];

export default function AppSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col border-r border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex h-20 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Pappi Gestor
            </p>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              ERP Food Service
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-orange-50 text-orange-700 shadow-sm dark:bg-orange-500/10 dark:text-orange-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive
                      ? "text-orange-500"
                      : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="rounded-2xl bg-zinc-900 p-4 text-white dark:bg-zinc-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-400">
            Controle forte
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-200">
            Estoque simples de operar, mas implacável no controle.
          </p>
        </div>
      </div>
    </aside>
  );
}
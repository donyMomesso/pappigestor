"use client";

import { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { useTheme } from "@/react-app/hooks/useTheme";
import AssistenteIA from "@/react-app/components/AssistenteIA";

import {
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  Menu,
  ChevronDown,
  Wifi,
  ListTodo,
  Inbox,
  Bot,
  Home,
  Receipt,
  Wallet,
  X,
} from "lucide-react";

const LOGO_URL =
  "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

const BANNER_URL = "/banner.png";

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: string[];
  feature?: string;
}

interface NavGroup {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  {
    label: "Início",
    href: "/app",
    icon: <Home className="w-4 h-4" />,
    roles: ["operador", "comprador", "financeiro", "admin_empresa", "super_admin", "dono", "admin"],
  },
  {
    label: "Caixa de Entrada",
    href: "/app/caixa-entrada",
    icon: <Inbox className="w-4 h-4" />,
    roles: ["comprador", "financeiro", "admin_empresa", "super_admin", "dono", "admin"],
    feature: "caixa_entrada",
  },
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["admin_empresa", "super_admin", "financeiro", "dono", "admin"],
  },
  {
    label: "Assessor IA",
    href: "/app/assessor-ia",
    icon: <Bot className="w-4 h-4" />,
    roles: ["financeiro", "comprador", "admin_empresa", "super_admin", "dono", "admin"],
    feature: "assessor_ia",
  },
];

const navGroups: NavGroup[] = [
  {
    label: "Compras",
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      {
        label: "Nova Compra",
        href: "/app/comprador",
        icon: <ShoppingCart className="w-4 h-4" />,
        roles: ["comprador", "admin_empresa", "super_admin", "dono", "admin"],
      },
      {
        label: "Lista de Compras",
        href: "/app/lista-compras",
        icon: <ListTodo className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin_empresa", "super_admin", "dono", "admin"],
      },
      {
        label: "Recebimento",
        href: "/app/recebimento",
        icon: <Package className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin_empresa", "super_admin", "dono", "admin"],
      },
    ],
  },
  {
    label: "Financeiro",
    icon: <DollarSign className="w-4 h-4" />,
    items: [
      {
        label: "Controle Financeiro",
        href: "/app/financeiro",
        icon: <DollarSign className="w-4 h-4" />,
        roles: ["financeiro", "admin_empresa", "super_admin", "dono", "admin"],
      },
      {
        label: "Open Finance",
        href: "/app/financeiro/open-finance",
        icon: <Wifi className="w-4 h-4" />,
        roles: ["financeiro", "admin_empresa", "super_admin", "dono", "admin"],
      },
      {
        label: "DDA",
        href: "/app/financeiro/dda",
        icon: <Receipt className="w-4 h-4" />,
        roles: ["financeiro", "admin_empresa", "super_admin", "dono", "admin"],
      },
      {
        label: "CMV",
        href: "/app/financeiro/cmv",
        icon: <Wallet className="w-4 h-4" />,
        roles: ["financeiro", "admin_empresa", "super_admin", "dono", "admin"],
      },
    ],
  },
];

// ===============================
// HELPERS DE EMPRESA
// ===============================
function getEmpresaIdStorage(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("empresaId") ||
    localStorage.getItem("companyId") ||
    localStorage.getItem("empresa_id") ||
    localStorage.getItem("company_id") ||
    localStorage.getItem("pId") ||
    localStorage.getItem("empresaId") ||
    ""
  );
}

function setEmpresaIdStorage(id: string) {
  if (typeof window === "undefined" || !id) return;

  localStorage.setItem("empresaId", id);
  localStorage.setItem("companyId", id);
  localStorage.setItem("empresa_id", id);
  localStorage.setItem("company_id", id);
  localStorage.setItem("pId", id);
  localStorage.setItem("empresaId", id);
}

function DropdownMenu({
  group,
  hasPermission,
  hasFeature,
}: {
  group: NavGroup;
  hasPermission: (roles: string[]) => boolean;
  hasFeature: (feature: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  const visibleItems = group.items.filter((item) => {
    if (!hasPermission(item.roles)) return false;
    if (item.feature && !hasFeature(item.feature)) return false;
    return true;
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (visibleItems.length === 0) return null;

  const groupActive = visibleItems.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          groupActive ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-100"
        }`}
        type="button"
      >
        {group.icon}
        <span>{group.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  active
                    ? "bg-orange-50 text-orange-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const auth = useAppAuth() as any;
  const {
    localUser,
    hasPermission,
    hasFeature,
    logout,
    signOut,
    loading,
    isLoading,
  } = auth;

  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [inboxCount, setInboxCount] = useState(0);

  const authLoading = loading ?? isLoading ?? false;

  // ===============================
  // GARANTE EMPRESA NO STORAGE
  // ===============================
  const ensureEmpresaId = useCallback(async () => {
    const jaTem = getEmpresaIdStorage();
    if (jaTem) return jaTem;

    const vindoDoUsuario = String(
      localUser?.empresa_id ||
        localUser?.company_id ||
        localUser?.empresaId ||
        localUser?.companyId ||
        localUser?.empresa?.id ||
        ""
    ).trim();

    if (vindoDoUsuario) {
      setEmpresaIdStorage(vindoDoUsuario);
      return vindoDoUsuario;
    }

    try {
      const res = await fetch("/api/empresas/minhas", { cache: "no-store" });
      if (!res.ok) return "";

      const data = await res.json();
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.empresas)
        ? data.empresas
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const primeira = lista?.[0];
      const id = String(
        primeira?.id || primeira?.empresa_id || primeira?.company_id || ""
      ).trim();

      if (id) {
        setEmpresaIdStorage(id);
        return id;
      }

      return "";
    } catch {
      return "";
    }
  }, [localUser]);

  useEffect(() => {
    if (localUser) {
      void ensureEmpresaId();
    }
  }, [localUser, ensureEmpresaId]);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await fetch("/api/ia/inbox-count");
        const data = (await res.json()) as { count: number };
        setInboxCount(data.count || 0);
      } catch {
        // ignore
      }
    };

    if (localUser) {
      void fetchInbox();
    }
  }, [pathname, localUser]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (logout) {
      await logout();
      return;
    }

    if (signOut) {
      await signOut();
      return;
    }

    window.location.href = "/login";
  };

  const visibleMainItems = mainNavItems
    .filter((i) => hasPermission(i.roles))
    .filter((i) => (i.feature ? hasFeature(i.feature) : true));

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!hasPermission(item.roles)) return false;
        if (item.feature && !hasFeature(item.feature)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 group shrink-0">
            <img
              src={LOGO_URL}
              alt="Pappi"
              className="h-8 w-8 group-hover:scale-110 transition-transform"
            />
            <span className="font-black italic uppercase text-gray-900 dark:text-white">
              Pappi<span className="text-orange-600">Gestor</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {visibleMainItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase italic transition-all ${
                    active
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.href === "/app/caixa-entrada" && inboxCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[9px] text-white flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                      {inboxCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {visibleNavGroups.map((group) => (
              <DropdownMenu
                key={group.label}
                group={group}
                hasPermission={hasPermission}
                hasFeature={hasFeature}
              />
            ))}

            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-xl text-xs font-bold uppercase italic text-gray-500 hover:bg-gray-100"
              type="button"
            >
              Sair
            </button>
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
            type="button"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <div className="space-y-2">
                {visibleMainItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold ${
                        active
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {visibleNavGroups.map((group) => (
                <div key={group.label} className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 px-1 mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    {group.icon}
                    {group.label}
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold ${
                            active
                              ? "bg-orange-100 text-orange-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
                  type="button"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <img
          src={BANNER_URL}
          alt="Banner"
          className="w-full rounded-2xl border border-gray-200/60"
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      <AssistenteIA
        contexto={pathname.replace("/app", "").replace("/", "") || "home"}
      />
    </div>
  );
}
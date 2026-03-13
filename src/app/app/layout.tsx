"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppAuth } from "@/contexts/AppAuthContext";
import type { Feature, NivelAcesso } from "@/react-app/types/auth";
import { PREMIUM_FEATURES } from "@/react-app/types/auth";
import {
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Truck,
  Box,
  ClipboardCheck,
  ListTodo,
  FileSearch,
  Database,
  Bot,
  Home,
  Settings,
  Layers,
  CreditCard,
  Inbox,
  Trophy,
  Clock,
  Wifi,
  QrCode,
  Crown,
  Sparkles,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: NivelAcesso[];
  feature?: Feature;
}

interface NavGroup {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

const LOGO_URL =
  "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

const mainNavItems: NavItem[] = [
  {
    label: "Início",
    href: "/app",
    icon: <Home className="w-4 h-4" />,
    roles: ["operador", "comprador", "financeiro", "admin", "dono", "viewer"],
  },
  {
    label: "Caixa de Entrada",
    href: "/app/caixa-entrada",
    icon: <Inbox className="w-4 h-4" />,
    roles: ["comprador", "financeiro", "admin", "dono"],
    feature: "caixa_entrada",
  },
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["financeiro", "admin", "dono"],
  },
  {
    label: "Assessor IA",
    href: "/app/assessor-ia",
    icon: <Bot className="w-4 h-4" />,
    roles: ["financeiro", "comprador", "admin", "dono"],
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
        roles: ["comprador", "admin", "dono"],
      },
      {
        label: "Compras IA",
        href: "/app/compras",
        icon: <Sparkles className="w-4 h-4" />,
        roles: ["comprador", "admin", "dono"],
      },
      {
        label: "Lista de Compras",
        href: "/app/lista-compras",
        icon: <ListTodo className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin", "dono"],
      },
      {
        label: "Compra Mercado",
        href: "/app/compra-mercado",
        icon: <QrCode className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin", "dono"],
      },
      {
        label: "Cotações",
        href: "/app/cotacao",
        icon: <FileSearch className="w-4 h-4" />,
        roles: ["comprador", "admin", "dono"],
        feature: "cotacao",
      },
      {
        label: "Ranking Preços",
        href: "/app/ranking-fornecedores",
        icon: <Trophy className="w-4 h-4" />,
        roles: ["comprador", "financeiro", "admin", "dono"],
      },
      {
        label: "Recebimento",
        href: "/app/recebimento",
        icon: <Package className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin", "dono"],
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
        roles: ["financeiro", "admin", "dono"],
      },
      {
        label: "Boletos DDA",
        href: "/app/boletos-dda",
        icon: <CreditCard className="w-4 h-4" />,
        roles: ["financeiro", "admin", "dono"],
        feature: "dda",
      },
      {
        label: "Open Finance",
        href: "/app/open-finance",
        icon: <Wifi className="w-4 h-4" />,
        roles: ["financeiro", "admin", "dono"],
        feature: "dda",
      },
    ],
  },
  {
    label: "Cadastros",
    icon: <Layers className="w-4 h-4" />,
    items: [
      {
        label: "Fornecedores",
        href: "/app/fornecedores",
        icon: <Truck className="w-4 h-4" />,
        roles: ["comprador", "admin", "dono"],
      },
      {
        label: "Produtos",
        href: "/app/produtos",
        icon: <Box className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin", "dono"],
      },
      {
        label: "Catálogo Master",
        href: "/app/produtos-master",
        icon: <Database className="w-4 h-4" />,
        roles: ["comprador", "admin", "dono"],
        feature: "produtos_master",
      },
      {
        label: "Estoque",
        href: "/app/estoque",
        icon: <ClipboardCheck className="w-4 h-4" />,
        roles: ["operador", "comprador", "admin", "dono"],
      },
    ],
  },
  {
    label: "Admin",
    icon: <Settings className="w-4 h-4" />,
    items: [
      {
        label: "Aprovações",
        href: "/app/aprovacoes",
        icon: <Clock className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Configurações",
        href: "/app/configuracoes",
        icon: <Settings className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Usuários",
        href: "/app/usuarios",
        icon: <Users className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Empresas",
        href: "/app/empresas",
        icon: <Building2 className="w-4 h-4" />,
        roles: ["admin"],
      },
    ],
  },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DropdownMenu({
  group,
  pathname,
  hasRole,
  hasFeature,
}: {
  group: NavGroup;
  pathname: string;
  hasRole: (allowed: NivelAcesso | NivelAcesso[]) => boolean;
  hasFeature: (feature: Feature) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visibleItems = group.items.filter((item) => hasRole(item.roles));
  const isGroupActive = visibleItems.some((item) => isPathActive(pathname, item.href));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (visibleItems.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isGroupActive
            ? "bg-orange-100 text-orange-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {group.icon}
        <span className="hidden lg:inline">{group.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleItems.map((item) => {
            const active = isPathActive(pathname, item.href);
            const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
            const allowed = !item.feature || hasFeature(item.feature);

            if (!allowed) {
              return (
                <Link
                  key={item.href}
                  href="/app/configuracoes?tab=assinatura"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                    <Crown className="w-3 h-3" />
                    PRO
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-orange-50 text-orange-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {isPremium && (
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProtectedLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    localUser,
    signOut,
    hasRole,
    hasFeature,
    isLoading,
  } = useAppAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const empresaNome = localUser?.nome_empresa || "Pappi Gestor";

  const visibleMainItems = useMemo(() => {
    return mainNavItems.filter((item) => hasRole(item.roles));
  }, [hasRole]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!isLoading && !localUser && pathname.startsWith("/app")) {
      router.replace("/login");
    }
  }, [isLoading, localUser, pathname, router]);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-2">
            <Link href="/app" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <img
                  src={LOGO_URL}
                  alt="Pappi Gestor"
                  className="h-8 w-8 sm:h-9 sm:w-9 object-contain transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-bold text-gray-900 hidden md:block">
                {empresaNome}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {visibleMainItems.map((item) => {
                const active = isPathActive(pathname, item.href);
                const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
                const allowed = !item.feature || hasFeature(item.feature);

                if (!allowed) {
                  return (
                    <Link
                      key={item.href}
                      href="/app/configuracoes?tab=assinatura"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-purple-50 transition-all"
                    >
                      {item.icon}
                      <span className="hidden lg:inline">{item.label}</span>
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                        <Crown className="w-3 h-3" />
                        PRO
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-orange-100 text-orange-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    <span className="hidden lg:inline">{item.label}</span>
                    {isPremium && (
                      <span className="px-1 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold rounded">
                        PRO
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="w-px h-6 bg-gray-200 mx-1" />

              {navGroups.map((group) => (
                <DropdownMenu
                  key={group.label}
                  group={group}
                  pathname={pathname}
                  hasRole={hasRole}
                  hasFeature={hasFeature}
                />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {localUser?.nome?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{localUser?.nome || "Usuário"}</p>
                      <p className="text-sm text-gray-500 truncate">{localUser?.email || ""}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          {localUser?.nivel_acesso || "perfil"}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 truncate">
                          {empresaNome}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <nav className="px-3 py-3 max-h-[70vh] overflow-auto">
              <div className="space-y-1 mb-3">
                {visibleMainItems.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
                  const allowed = !item.feature || hasFeature(item.feature);

                  if (!allowed) {
                    return (
                      <Link
                        key={item.href}
                        href="/app/configuracoes?tab=assinatura"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-purple-50 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          {item.icon}
                          {item.label}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                          <Crown className="w-3 h-3" />
                          PRO
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      {isPremium && (
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                          PRO
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {navGroups.map((group) => {
                const visibleItems = group.items.filter((item) => hasRole(item.roles));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.label} className="mb-3">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {group.icon}
                      {group.label}
                    </div>

                    <div className="space-y-1 pl-2 border-l-2 border-gray-200 ml-4">
                      {visibleItems.map((item) => {
                        const active = isPathActive(pathname, item.href);
                        const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
                        const allowed = !item.feature || hasFeature(item.feature);

                        if (!allowed) {
                          return (
                            <Link
                              key={item.href}
                              href="/app/configuracoes?tab=assinatura"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-purple-50 transition-colors"
                            >
                              <span className="flex items-center gap-3">
                                {item.icon}
                                {item.label}
                              </span>
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                                <Crown className="w-3 h-3" />
                                PRO
                              </span>
                            </Link>
                          );
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              active
                                ? "bg-orange-100 text-orange-700"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              {item.icon}
                              {item.label}
                            </span>
                            {isPremium && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                                PRO
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>

      {hasFeature("assessor_ia") && (
        <Link
          href="/app/assessor-ia"
          className="fixed bottom-8 right-8 md:bottom-10 md:right-10 group z-50"
        >
          <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 group-hover:opacity-40 transition-all" />
          <button className="relative w-16 h-16 bg-gradient-to-br from-orange-600 to-pink-600 rounded-[22px] shadow-2xl flex items-center justify-center text-white border-2 border-white/20 hover:rotate-6 transition-transform hover:scale-110 active:scale-90">
            <Sparkles size={28} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </button>
        </Link>
      )}
    </div>
  );
}
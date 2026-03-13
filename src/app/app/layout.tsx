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
  Brain,
  Home,
  Settings,
  Layers,
  CreditCard,
  Inbox,
  Trophy,
  Clock,
  Wifi,
  Crown,
  Sparkles,
  ChevronRight,
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
  highlight?: boolean;
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
    label: "Dashboard",
    href: "/app/dashboard",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["financeiro", "admin", "dono"],
  },
  {
    label: "Financeiro",
    href: "/app/financeiro",
    icon: <DollarSign className="w-4 h-4" />,
    roles: ["financeiro", "admin", "dono"],
  },
  {
    label: "Assessor IA",
    href: "/app/assessor-ia",
    icon: <Brain className="w-4 h-4" />,
    roles: ["comprador", "financeiro", "admin", "dono"],
    feature: "assessor_ia",
    highlight: true,
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
        icon: <ShoppingCart className="w-4 h-4" />,
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
      {
        label: "Precificação",
        href: "/app/precificacao",
        icon: <BarChart3 className="w-4 h-4" />,
        roles: ["financeiro", "admin", "dono"],
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
        label: "Catálogo Global",
        href: "/app/catalogo-global",
        icon: <Database className="w-4 h-4" />,
        roles: ["admin", "dono"],
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
        label: "Equipe",
        href: "/app/equipe",
        icon: <Users className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Usuários",
        href: "/app/usuarios",
        icon: <Users className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Configurações",
        href: "/app/configuracoes",
        icon: <Settings className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Onboarding",
        href: "/app/onboarding",
        icon: <Sparkles className="w-4 h-4" />,
        roles: ["admin", "dono"],
      },
      {
        label: "Empresas",
        href: "/app/empresas",
        icon: <Building2 className="w-4 h-4" />,
        roles: ["admin", "dono"],
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
  const activeGroup = visibleItems.some((item) => isPathActive(pathname, item.href));

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (!visibleItems.length) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
          activeGroup
            ? "bg-orange-100 text-orange-700"
            : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
        }`}
      >
        {group.icon}
        <span className="hidden xl:inline">{group.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-orange-100 bg-white p-2 shadow-2xl">
          <div className="mb-1 flex items-center gap-2 px-3 py-2">
            <div className="rounded-xl bg-orange-50 p-2 text-orange-600">{group.icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                módulo
              </p>
              <p className="text-sm font-black text-gray-900">{group.label}</p>
            </div>
          </div>

          <div className="space-y-1">
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
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-purple-50"
                  >
                    <span className="flex items-center gap-3 text-gray-500">
                      {item.icon}
                      {item.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Crown className="h-3 w-3" />
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
                  className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all ${
                    active
                      ? "bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500 text-white"
                      : "text-gray-700 hover:bg-orange-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isPremium && !active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Crown className="h-3 w-3" />
                        PRO
                      </span>
                    )}
                    <ChevronRight className={`h-4 w-4 ${active ? "text-white" : "text-gray-400"}`} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { localUser, signOut, hasRole, hasFeature, isLoading } = useAppAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const empresaNome =
    localUser?.nome_empresa ||
    (localUser as any)?.empresa_nome ||
    "Pappi Gestor";

  const visibleMainItems = useMemo(
    () => mainNavItems.filter((item) => hasRole(item.roles)),
    [hasRole]
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
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
    <div className="min-h-screen bg-[linear-gradient(to_bottom,rgba(255,247,237,0.95),rgba(255,255,255,1)),radial-gradient(circle_at_top_right,rgba(244,63,94,0.08),transparent_22%),radial-gradient(circle_at_top_left,rgba(249,115,22,0.10),transparent_28%)]">
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 shadow-[0_8px_30px_rgba(249,115,22,0.06)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Link href="/app" className="flex items-center gap-2">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-pink-500 p-2 shadow-lg shadow-orange-500/20">
                  <img
                    src={LOGO_URL}
                    alt="Pappi Gestor"
                    className="h-6 w-6 object-contain brightness-0 invert"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-900 sm:text-base">
                    {empresaNome}
                  </p>
                  <p className="hidden text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500 sm:block">
                    central inteligente
                  </p>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-1 xl:flex">
              <div className="flex items-center gap-1 rounded-2xl border border-orange-100 bg-orange-50/60 p-1">
                {visibleMainItems.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
                  const allowed = !item.feature || hasFeature(item.feature);

                  if (!allowed) {
                    return (
                      <Link
                        key={item.href}
                        href="/app/configuracoes?tab=assinatura"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-purple-700 transition-all hover:bg-purple-50"
                      >
                        {item.icon}
                        <span className="hidden 2xl:inline">{item.label}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Crown className="h-3 w-3" />
                          PRO
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                        active
                          ? "bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500 text-white shadow-md"
                          : item.highlight
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "text-gray-700 hover:bg-white hover:text-orange-700"
                      }`}
                    >
                      {item.icon}
                      <span className="hidden 2xl:inline">{item.label}</span>
                      {isPremium && !active && (
                        <span className="hidden 2xl:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Crown className="h-3 w-3" />
                          PRO
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="mx-1 h-5 w-px bg-orange-200" />

                {navGroups.map((group) => (
                  <DropdownMenu
                    key={group.label}
                    group={group}
                    pathname={pathname}
                    hasRole={hasRole}
                    hasFeature={hasFeature}
                  />
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-2">
              {hasFeature("assessor_ia") && (
                <Link
                  href="/app/assessor-ia"
                  className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-orange-100 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-200"
                >
                  <Sparkles className="h-4 w-4" />
                  IA
                </Link>
              )}

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-2 py-1.5 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-500 to-pink-500 text-sm font-black text-white">
                    {localUser?.nome?.charAt(0).toUpperCase() || "U"}
                  </div>

                  <div className="hidden text-left md:block">
                    <p className="max-w-[120px] truncate text-xs font-black text-gray-900">
                      {localUser?.nome || "Usuário"}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">
                      {localUser?.nivel_acesso || "perfil"}
                    </p>
                  </div>

                  <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl">
                    <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-black">
                          {localUser?.nome?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{localUser?.nome || "Usuário"}</p>
                          <p className="truncate text-xs text-orange-100">{localUser?.email || ""}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                          {localUser?.nivel_acesso || "perfil"}
                        </span>
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                          {empresaNome}
                        </span>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/app/configuracoes"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50"
                      >
                        <span className="flex items-center gap-3">
                          <Settings className="h-4 w-4" />
                          Configurações
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <span className="flex items-center gap-3">
                          <LogOut className="h-4 w-4" />
                          Sair da conta
                        </span>
                        <ChevronRight className="h-4 w-4 text-red-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="rounded-xl border border-orange-100 bg-white p-2.5 shadow-sm xl:hidden"
                aria-label="Abrir menu"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-orange-100 bg-white xl:hidden">
            <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 lg:px-8">
              <div className="space-y-2">
                {visibleMainItems.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
                  const allowed = !item.feature || hasFeature(item.feature);

                  if (!allowed) {
                    return (
                      <Link
                        key={item.href}
                        href="/app/configuracoes?tab=assinatura"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700"
                      >
                        <span className="flex items-center gap-3">
                          {item.icon}
                          {item.label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Crown className="h-3 w-3" />
                          PRO
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${
                        active
                          ? "bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500 text-white"
                          : "bg-orange-50 text-gray-800"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      {isPremium && !active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Crown className="h-3 w-3" />
                          PRO
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 space-y-3">
                {navGroups.map((group) => {
                  const visibleItems = group.items.filter((item) => hasRole(item.roles));
                  if (!visibleItems.length) return null;

                  return (
                    <div
                      key={group.label}
                      className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-2 border-b border-orange-100 px-4 py-3">
                        <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
                          {group.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                            módulo
                          </p>
                          <p className="text-sm font-black text-gray-900">{group.label}</p>
                        </div>
                      </div>

                      <div className="p-2">
                        {visibleItems.map((item) => {
                          const active = isPathActive(pathname, item.href);
                          const isPremium = !!item.feature && PREMIUM_FEATURES.includes(item.feature);
                          const allowed = !item.feature || hasFeature(item.feature);

                          if (!allowed) {
                            return (
                              <Link
                                key={item.href}
                                href="/app/configuracoes?tab=assinatura"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-gray-500 hover:bg-purple-50"
                              >
                                <span className="flex items-center gap-3">
                                  {item.icon}
                                  {item.label}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                  <Crown className="h-3 w-3" />
                                  PRO
                                </span>
                              </Link>
                            );
                          }

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm ${
                                active
                                  ? "bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500 text-white"
                                  : "text-gray-700 hover:bg-orange-50"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                              </span>

                              <div className="flex items-center gap-2">
                                {isPremium && !active && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    <Crown className="h-3 w-3" />
                                    PRO
                                  </span>
                                )}
                                <ChevronRight className={`h-4 w-4 ${active ? "text-white" : "text-gray-400"}`} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-8 lg:py-5">
        {children}
      </main>

      {hasFeature("assessor_ia") && (
        <Link
          href="/app/assessor-ia"
          className="group fixed bottom-5 right-5 z-50 md:bottom-7 md:right-7"
        >
          <div className="absolute inset-0 rounded-2xl bg-orange-500 blur-2xl opacity-20 transition-all group-hover:opacity-35" />
          <button className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-pink-500 text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-105 active:scale-95">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </button>
        </Link>
      )}
    </div>
  );
}
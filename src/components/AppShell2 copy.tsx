"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  Sun,
  Moon,
  Trophy,
  Clock,
  Wifi,
  QrCode,
} from "lucide-react";
import { Crown } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabaseClient"
import { useAppAuth } from "@/hooks/useAppAuth";

// Se você ainda não migrou o assistente, deixa assim por enquanto
const AssistenteIA = ({ contexto }: { contexto: string }) => null;

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("theme")) as any;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

const PREMIUM_FEATURES: string[] = ["caixa_entrada", "assessor_ia", "cotacao", "dda", "produtos_master"];
const NIVEL_LABELS: Record<string, string> = {
  operador: "Operador",
  comprador: "Comprador",
  financeiro: "Financeiro",
  admin_empresa: "Admin",
  super_admin: "Super Admin",
};

const LOGO_URL = "/logo.png";

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

function withAppPrefix(href: string) {
  if (href === "/") return "/app";
  return `/app${href}`;
}

const mainNavItems: NavItem[] = [
  { label: "Início", href: "/", icon: <Home className="w-4 h-4" />, roles: ["operador", "comprador", "financeiro", "admin_empresa", "super_admin"] },
  { label: "Caixa de Entrada", href: "/caixa-entrada", icon: <Inbox className="w-4 h-4" />, roles: ["comprador", "financeiro", "admin_empresa", "super_admin"], feature: "caixa_entrada" },
  { label: "Dashboard", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, roles: ["admin_empresa", "super_admin", "financeiro"] },
  { label: "Assessor IA", href: "/assessor-ia", icon: <Bot className="w-4 h-4" />, roles: ["financeiro", "comprador", "admin_empresa", "super_admin"], feature: "assessor_ia" },
];

const navGroups: NavGroup[] = [
  {
    label: "Compras",
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      { label: "Nova Compra", href: "/comprador", icon: <ShoppingCart className="w-4 h-4" />, roles: ["comprador", "admin_empresa", "super_admin"] },
      { label: "Lista de Compras", href: "/lista-compras", icon: <ListTodo className="w-4 h-4" />, roles: ["operador", "comprador", "admin_empresa", "super_admin"] },
      { label: "Compra Mercado", href: "/compra-mercado", icon: <QrCode className="w-4 h-4" />, roles: ["operador", "comprador", "admin_empresa", "super_admin"] },
      { label: "Cotações", href: "/cotacao", icon: <FileSearch className="w-4 h-4" />, roles: ["comprador", "admin_empresa", "super_admin"], feature: "cotacao" },
      { label: "Ranking Preços", href: "/ranking-fornecedores", icon: <Trophy className="w-4 h-4" />, roles: ["comprador", "financeiro", "admin_empresa", "super_admin"] },
      { label: "Recebimento", href: "/recebimento", icon: <Package className="w-4 h-4" />, roles: ["operador", "comprador", "admin_empresa", "super_admin"] },
    ],
  },
  {
    label: "Financeiro",
    icon: <DollarSign className="w-4 h-4" />,
    items: [
      { label: "Controle Financeiro", href: "/financeiro", icon: <DollarSign className="w-4 h-4" />, roles: ["financeiro", "admin_empresa", "super_admin"] },
      { label: "Boletos DDA", href: "/boletos-dda", icon: <CreditCard className="w-4 h-4" />, roles: ["financeiro", "admin_empresa", "super_admin"], feature: "dda" },
      { label: "Open Finance", href: "/open-finance", icon: <Wifi className="w-4 h-4" />, roles: ["financeiro", "admin_empresa", "super_admin"], feature: "dda" },
    ],
  },
  {
    label: "Cadastros",
    icon: <Layers className="w-4 h-4" />,
    items: [
      { label: "Fornecedores", href: "/fornecedores", icon: <Truck className="w-4 h-4" />, roles: ["comprador", "admin_empresa", "super_admin"] },
      { label: "Produtos", href: "/produtos", icon: <Box className="w-4 h-4" />, roles: ["operador", "comprador", "admin_empresa", "super_admin"] },
      { label: "Catálogo Master", href: "/produtos-master", icon: <Database className="w-4 h-4" />, roles: ["comprador", "admin_empresa", "super_admin"], feature: "produtos_master" },
      { label: "Estoque", href: "/estoque", icon: <ClipboardCheck className="w-4 h-4" />, roles: ["operador", "comprador", "admin_empresa", "super_admin"] },
    ],
  },
  {
    label: "Admin",
    icon: <Settings className="w-4 h-4" />,
    items: [
      { label: "Aprovações", href: "/aprovacoes", icon: <Clock className="w-4 h-4" />, roles: ["admin_empresa", "super_admin"] },
      { label: "Configurações", href: "/configuracoes", icon: <Settings className="w-4 h-4" />, roles: ["admin_empresa", "super_admin"] },
      { label: "Usuários", href: "/usuarios", icon: <Users className="w-4 h-4" />, roles: ["admin_empresa", "super_admin"] },
      { label: "Empresas", href: "/empresas", icon: <Building2 className="w-4 h-4" />, roles: ["super_admin"] },
    ],
  },
];

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

  const visibleItems = group.items.filter((item) => hasPermission(item.roles));
  if (visibleItems.length === 0) return null;

  const isGroupActive = visibleItems.some((item) => pathname === withAppPrefix(item.href));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isGroupActive
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        {group.icon}
        <span className="hidden lg:inline">{group.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
          {visibleItems.map((item) => {
            const href = withAppPrefix(item.href);
            const isActive = pathname === href;
            const isPremium = item.feature && PREMIUM_FEATURES.includes(item.feature);
            const hasAccess = !item.feature || hasFeature(item.feature);

            return (
              <Link
                key={href}
                href={!hasAccess ? withAppPrefix("/configuracoes") + "?tab=assinatura" : href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                  !hasAccess
                    ? "text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    : isActive
                      ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {!hasAccess ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                ) : isPremium ? (
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                    PRO
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { loading, localUser, hasPermission, hasFeature } = useAppAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!localUser) {
      router.replace("/auth");
      return;
    }

    if (!localUser.empresa_id) {
      router.replace("/onboarding");
      return;
    }
  }, [loading, localUser, router]);

  const handleLogout = async () => {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  router.replace("/auth");
};
  const visibleMainItems = mainNavItems.filter((item) => hasPermission(item.roles));
  const contexto = (pathname?.split("/")[2] || "home").trim() || "home";

  if (loading) return <div className="p-6">Carregando...</div>;

  if (localUser && !localUser.empresa_id) return <div className="p-6">Redirecionando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-2">
            <Link href="/app" className="flex items-center gap-2 group flex-shrink-0">
              <img src={LOGO_URL} alt="Pappi Gestor" className="h-8 w-8 sm:h-9 sm:w-9 object-contain" />
              <span className="font-bold text-gray-900 dark:text-white hidden md:block">
                Pappi<span className="text-orange-600">Pizza</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {visibleMainItems.map((item) => {
                const href = withAppPrefix(item.href);
                const isActive = pathname === href;
                const isPremium = item.feature && PREMIUM_FEATURES.includes(item.feature);
                const hasAccess = !item.feature || hasFeature(item.feature);

                return (
                  <Link
                    key={href}
                    href={!hasAccess ? withAppPrefix("/configuracoes") + "?tab=assinatura" : href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      !hasAccess
                        ? "text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        : isActive
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {item.icon}
                    <span className="hidden lg:inline">{item.label}</span>
                    {!hasAccess ? (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                        <Crown className="w-3 h-3" /> PRO
                      </span>
                    ) : isPremium ? (
                      <span className="px-1 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold rounded">
                        PRO
                      </span>
                    ) : null}
                  </Link>
                );
              })}

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              {navGroups.map((group) => (
                <DropdownMenu key={group.label} group={group} hasPermission={hasPermission} hasFeature={hasFeature} />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {localUser?.nome?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-20">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white">{localUser?.nome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{localUser?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                            {NIVEL_LABELS[localUser?.nivel_acesso || ""] || localUser?.nivel_acesso}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{localUser?.empresa_nome}</span>
                        </div>
                      </div>

                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="flex items-center gap-2">
                          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                        </span>
                      </button>

                      <div className="border-t border-gray-100 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <nav className="px-3 py-3 max-h-[70vh] overflow-auto">
              <div className="space-y-1 mb-3">
                {visibleMainItems.map((item) => {
                  const href = withAppPrefix(item.href);
                  const isPremium = item.feature && PREMIUM_FEATURES.includes(item.feature);
                  const hasAccess = !item.feature || hasFeature(item.feature);

                  return (
                    <Link
                      key={href}
                      href={!hasAccess ? withAppPrefix("/configuracoes") + "?tab=assinatura" : href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      {!hasAccess ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      ) : isPremium ? (
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded">
                          PRO
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>

      <AssistenteIA contexto={contexto} />
    </div>
  );
}

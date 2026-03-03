"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import {
  ShoppingCart, Package, DollarSign, BarChart3, Users, Building2, LogOut,
  Menu, X, ChevronDown, Truck, Box, ClipboardCheck, ListTodo, FileSearch,
  Database, Bot, Home, Settings, Layers, CreditCard, Inbox, Sun, Moon,
  Trophy, Clock, Wifi, QrCode, Crown
} from "lucide-react";
import { useTheme } from "@/react-app/hooks/useTheme";
import { NIVEL_LABELS, PREMIUM_FEATURES } from "@/react-app/types/auth";
import AssistenteIA from "@/react-app/components/AssistenteIA";

const LOGO_URL = "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

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
      { label: "Recebimento", href: "/recebimento", icon: <Package className="w-4 h-4" />, roles: ["operador", "comprador", "admin_empresa", "super_admin"] },
    ],
  },
  {
    label: "Financeiro",
    icon: <DollarSign className="w-4 h-4" />,
    items: [
      { label: "Controle Financeiro", href: "/financeiro", icon: <DollarSign className="w-4 h-4" />, roles: ["financeiro", "admin_empresa", "super_admin"] },
      { label: "Open Finance", href: "/open-finance", icon: <Wifi className="w-4 h-4" />, roles: ["financeiro", "admin_empresa", "super_admin"], feature: "dda" },
    ],
  },
];

function DropdownMenu({ group, hasPermission, hasFeature }: { group: NavGroup; hasPermission: (roles: string[]) => boolean; hasFeature: (feature: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const visibleItems = group.items.filter(item => hasPermission(item.roles));
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (visibleItems.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${visibleItems.some(i => i.href === location.pathname) ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-100"}`}>
        {group.icon} <span>{group.label}</span> <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleItems.map(item => (
            <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-2 px-3 py-2 text-sm ${location.pathname === item.href ? "bg-orange-50 text-orange-700 font-bold" : "text-gray-700 hover:bg-gray-50"}`}>
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
 const auth = useAppAuth() as any; 
const { localUser, hasPermission, hasFeature, logout } = auth; // <-- ADICIONADO O LOGOUT
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await fetch('/api/ia/inbox-count');
        const data = await res.json() as { count: number };
        setInboxCount(data.count || 0);
      } catch (e) { /* ignore */ }
    };
    if (localUser) fetchInbox();
  }, [location.pathname, localUser]);

  const handleLogout = async () => { await logout(); window.location.href = "/login"; };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
             <img src={LOGO_URL} alt="Pappi" className="h-8 w-8 group-hover:scale-110 transition-transform" />
             <span className="font-black italic uppercase text-gray-900 dark:text-white">Pappi<span className="text-orange-600">Pizza</span></span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.filter(i => hasPermission(i.roles)).map(item => (
              <Link key={item.href} to={item.href} className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase italic transition-all ${location.pathname === item.href ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:bg-gray-100"}`}>
                {item.icon} {item.label}
                {item.href === "/caixa-entrada" && inboxCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[9px] text-white flex items-center justify-center rounded-full animate-pulse border-2 border-white">{inboxCount}</span>
                )}
              </Link>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2" />
            {navGroups.map(group => <DropdownMenu key={group.label} group={group} hasPermission={hasPermission} hasFeature={hasFeature} />)}
          </nav>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2"><Menu className="w-5 h-5" /></button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <AssistenteIA contexto={location.pathname.replace('/', '') || "home"} />
    </div>
  );
}
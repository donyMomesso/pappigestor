"use client";

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import {
  Home,
  ShoppingCart,
  DollarSign,
  Package,
  LogOut,
  Sparkles,
  Inbox,
  Menu,
  X,
  Settings,
  Calculator, // Adicionado para o módulo de precificação
} from "lucide-react";

type InboxCountResponse = { count: number };

type NavItemProps = {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
};

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [inboxCount, setInboxCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const LOGO_URL =
    "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

  // ✅ FAILSAFE: não derruba caso Provider não esteja acima
  let auth: any = null;
  try {
    auth = useAppAuth();
  } catch {
    auth = null;
  }

  const localUser = auth?.localUser ?? null;
  const signOut: undefined | (() => void | Promise<void>) = auth?.signOut;

  const empresaNome = useMemo(() => {
    return (
      localUser?.empresa_nome ||
      localUser?.nome_empresa ||
      localUser?.empresaNome ||
      "Pappi Gestor"
    );
  }, [localUser]);

  const nomeUser = useMemo(() => localUser?.nome || "Gestor", [localUser]);

  const initialLetter = useMemo(() => {
    const n = (localUser?.nome || "").trim();
    return n ? n.charAt(0).toUpperCase() : "P";
  }, [localUser]);

  // ✅ Proteção real: se tiver provider mas não tiver usuário, redireciona
  useEffect(() => {
    if (!auth) return; // ainda carregando provider
    if (!localUser && pathname?.startsWith("/app")) {
      router.replace("/login");
    }
  }, [auth, localUser, pathname, router]);

  // ✅ Fecha menu ao clicar fora e com ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // ✅ Inbox count com “anti-spam” e refresh
  useEffect(() => {
    let alive = true;
    let consecutiveFails = 0;

    const fetchInboxCount = async () => {
      try {
        const res = await fetch("/api/ia/inbox-count", { cache: "no-store" });
        if (!res.ok) {
          consecutiveFails++;
          if (consecutiveFails >= 3) return; 
          return;
        }
        const data = (await res.json()) as InboxCountResponse;
        if (!alive) return;
        setInboxCount(Number(data?.count || 0));
        consecutiveFails = 0;
      } catch {
        consecutiveFails++;
      }
    };

    fetchInboxCount();
    const interval = setInterval(fetchInboxCount, 60000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname?.startsWith(href);
  };

  const doSignOut = async () => {
    try {
      await signOut?.();
    } finally {
      router.replace("/");
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <header className="bg-white/70 backdrop-blur-2xl border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-pink-500 rounded-[20px] shadow-lg shadow-orange-200/50">
                <img src={LOGO_URL} alt="Logo" className="h-6 w-6 brightness-0 invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent leading-none">
                  Pappi Gestor
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 italic leading-none mt-1">
                  Central de Inteligência
                </span>
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 italic">
              Carregando...
            </div>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto p-6 md:p-8 animate-in fade-in duration-700">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <header className="bg-white/70 backdrop-blur-2xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/app"
              className="p-2.5 bg-gradient-to-br from-orange-500 to-pink-500 rounded-[20px] shadow-lg shadow-orange-200/50 transition-transform hover:scale-105 active:scale-95"
              onClick={() => setMobileOpen(false)}
            >
              <img src={LOGO_URL} alt="Logo" className="h-6 w-6 brightness-0 invert" />
            </Link>

            <div className="flex flex-col">
              <span className="text-xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent leading-none">
                {empresaNome}
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 italic leading-none mt-1">
                Central de Inteligência
              </span>
            </div>
          </div>

          {/* Menu Desktop - NavItem Precificação adicionado abaixo */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100/40 p-1.5 rounded-[28px] border border-gray-100 shadow-inner">
            <NavItem href="/app" active={isActive("/app")} icon={<Home size={18} />} label="Dashboard" />
            <NavItem
              href="/app/caixa-entrada"
              active={isActive("/app/caixa-entrada")}
              icon={<Inbox size={18} />}
              label="Inbox"
              badge={inboxCount}
            />
            <NavItem href="/app/compras" active={isActive("/app/compras")} icon={<ShoppingCart size={18} />} label="Compras" />
            <NavItem href="/app/financeiro" active={isActive("/app/financeiro")} icon={<DollarSign size={18} />} label="Financeiro" />
            <NavItem href="/app/estoque" active={isActive("/app/estoque")} icon={<Package size={18} />} label="Estoque" />
            <NavItem href="/app/precificacao" active={isActive("/app/precificacao")} icon={<Calculator size={18} />} label="Eng. Preços" />
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              className="lg:hidden w-11 h-11 rounded-[18px] bg-white border border-gray-100 shadow-sm flex items-center justify-center"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="hidden md:block text-right">
              <p className="text-xs font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                {nomeUser}
              </p>
              <p className="text-[9px] uppercase font-black text-orange-600 italic mt-1 tracking-widest leading-none">
                Acesso Pro
              </p>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-12 h-12 rounded-[18px] bg-gray-900 shadow-xl flex items-center justify-center text-white font-black italic text-lg hover:scale-105 transition-all border-4 border-white ring-1 ring-gray-100"
                aria-label="Menu do usuário"
              >
                {initialLetter}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[28px] shadow-2xl border border-gray-100 p-3 z-50">
                  <p className="px-4 py-2 text-[9px] font-black uppercase text-gray-400 italic tracking-[0.2em] border-b border-gray-50 mb-2">
                    Sua Conta
                  </p>

                  <Link
                    href="/app/configuracoes"
                    onClick={() => {
                      setMenuOpen(false);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold italic uppercase text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <Settings size={16} /> Configurações
                  </Link>

                  <button
                    onClick={doSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black italic uppercase text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut size={16} /> Sair do Sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Mobile - Item Precificação adicionado abaixo */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/70 backdrop-blur-2xl">
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-2">
              <NavItem href="/app" active={isActive("/app")} icon={<Home size={18} />} label="Dashboard" onClick={() => setMobileOpen(false)} />
              <NavItem
                href="/app/caixa-entrada"
                active={isActive("/app/caixa-entrada")}
                icon={<Inbox size={18} />}
                label="Inbox"
                badge={inboxCount}
                onClick={() => setMobileOpen(false)}
              />
              <NavItem href="/app/compras" active={isActive("/app/compras")} icon={<ShoppingCart size={18} />} label="Compras" onClick={() => setMobileOpen(false)} />
              <NavItem href="/app/financeiro" active={isActive("/app/financeiro")} icon={<DollarSign size={18} />} label="Financeiro" onClick={() => setMobileOpen(false)} />
              <NavItem href="/app/estoque" active={isActive("/app/estoque")} icon={<Package size={18} />} label="Estoque" onClick={() => setMobileOpen(false)} />
              <NavItem href="/app/precificacao" active={isActive("/app/precificacao")} icon={<Calculator size={18} />} label="Eng. Preços" onClick={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-[1600px] mx-auto p-6 md:p-8 animate-in fade-in duration-700">
        {children}
      </main>

      <Link href="/app/assessor-ia" className="fixed bottom-8 right-8 md:bottom-10 md:right-10 group z-50">
        <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 group-hover:opacity-40 transition-all" />
        <button className="relative w-16 h-16 bg-gradient-to-br from-orange-600 to-pink-600 rounded-[22px] shadow-2xl flex items-center justify-center text-white border-2 border-white/20 hover:rotate-6 transition-transform hover:scale-110 active:scale-90">
          <Sparkles size={28} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        </button>
      </Link>
    </div>
  );
}

function NavItem({ href, active, icon, label, badge = 0, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-6 py-3 rounded-[22px] transition-all duration-300 ${
        active
          ? "bg-white text-orange-600 font-black italic shadow-md shadow-orange-100/50 border border-orange-50"
          : "text-gray-400 hover:text-gray-700 hover:bg-white/60"
      }`}
    >
      <span className={active ? "text-orange-600" : "text-gray-400"}>{icon}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] font-black leading-none">{label}</span>

      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-4 ring-gray-50 shadow-lg">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
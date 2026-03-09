"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Calculator,
  Brain,
  ChevronDown,
} from "lucide-react";

// ===================================================================
// 1. CONTEXTO DE AUTENTICAÇÃO (AppAuthContext.tsx)
// Coloquei o conteúdo do seu context aqui para facilitar.
// O ideal é que isso fique em um arquivo separado como `src/contexts/AppAuthContext.tsx`
// ===================================================================

// Defina os tipos para o usuário local e o contexto
interface LocalUser {
  empresa_id: string;
  empresa_nome?: string;
  nome_empresa?: string;
  empresaNome?: string;
  nome?: string;
  role?: string;
}

interface AppAuthContextType {
  localUser: LocalUser | null;
  signOut: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthContextType | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("pappi_user");
      if (userStr) {
        setLocalUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error("Falha ao carregar usuário do localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    localStorage.removeItem("pappi_user");
    setLocalUser(null);
    // Adicione aqui qualquer outra lógica de signOut, como chamar o Supabase
  };

  const value = { localUser, signOut };

  // Mostra um loader global enquanto o usuário é carregado do localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2">
          <Sparkles className="w-4 h-4 text-orange-500 animate-spin" />
          <span className="text-[10px] uppercase font-black tracking-[0.22em] italic text-orange-600">
            iniciando...
          </span>
        </div>
      </div>
    );
  }

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error("useAppAuth deve ser usado dentro de AppAuthProvider");
  }
  return ctx;
}

// ===================================================================
// 2. LAYOUT PROTEGIDO (ProtectedLayout)
// Este é o seu componente de layout, agora corrigido para consumir o contexto.
// ===================================================================

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

function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Agora `useAppAuth` funciona sem precisar de try/catch
  const { localUser, signOut } = useAppAuth();

  const [inboxCount, setInboxCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const LOGO_URL =
    "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

  useEffect(( ) => {
    // Se o usuário não estiver logado, redireciona para o login
    if (!localUser) {
      router.replace("/login");
    }
  }, [localUser, router]);

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

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
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
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchInboxCount = async () => {
      try {
        const res = await fetch("/api/ia/inbox-count", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { count: number };
          if (alive) setInboxCount(Number(data?.count || 0));
        }
      } catch {}
    };
    fetchInboxCount();
    const interval = setInterval(fetchInboxCount, 60000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname?.startsWith(href);
  };

  const doSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  // Se o usuário ainda não foi carregado, não renderiza o layout completo
  if (!localUser) {
    return null; // O loader do AppAuthProvider já está visível
  }

  // O resto do seu código JSX permanece o mesmo
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <Link
              href="/app"
              className="shrink-0 p-2.5 bg-gradient-to-br from-orange-500 to-pink-500 rounded-[20px] shadow-lg shadow-orange-200/50 transition-transform hover:scale-105 active:scale-95"
              onClick={() => setMobileOpen(false)}
            >
              <img
                src={LOGO_URL}
                alt="Logo"
                className="h-6 w-6 brightness-0 invert"
              />
            </Link>
            <div className="min-w-0 hidden sm:flex flex-col">
              <span className="text-xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent leading-none truncate">
                {empresaNome}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.34em] text-gray-400 italic mt-1">
                central de inteligência
              </span>
            </div>
          </div>
          <nav className="hidden xl:flex items-center gap-1 bg-gray-100/70 p-1.5 rounded-[28px] border border-gray-100 shadow-inner">
            <NavItem
              href="/app"
              active={isActive("/app")}
              icon={<Home size={18} />}
              label="Dashboard"
            />
            <NavItem
              href="/app/caixa-entrada"
              active={isActive("/app/caixa-entrada")}
              icon={<Inbox size={18} />}
              label="Inbox"
              badge={inboxCount}
            />
            <NavItem
              href="/app/compras"
              active={isActive("/app/compras")}
              icon={<ShoppingCart size={18} />}
              label="Compras"
            />
            <NavItem
              href="/app/financeiro"
              active={isActive("/app/financeiro")}
              icon={<DollarSign size={18} />}
              label="Financeiro"
            />
            <NavItem
              href="/app/estoque"
              active={isActive("/app/estoque")}
              icon={<Package size={18} />}
              label="Estoque"
            />
            <NavItem
              href="/app/precificacao"
              active={isActive("/app/precificacao")}
              icon={<Calculator size={18} />}
              label="Eng. Preços"
            />
          </nav>
          <div className="flex items-center gap-3">
            <button
              className="xl:hidden w-11 h-11 rounded-[18px] bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-700"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-[22px] border border-gray-100 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center font-black italic">
                {initialLetter}
              </div>
              <div className="text-left">
                <p className="text-xs font-black italic uppercase tracking-tight text-gray-900 leading-none">
                  {nomeUser}
                </p>
                <p className="text-[10px] uppercase font-black text-orange-600 italic mt-1 tracking-[0.18em] leading-none">
                  ambiente ativo
                </p>
              </div>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-12 h-12 rounded-[18px] bg-gray-900 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-all border-4 border-white ring-1 ring-gray-100"
                aria-label="Menu do usuário"
              >
                <ChevronDown size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-[28px] shadow-2xl border border-gray-100 p-3 z-50">
                  <div className="px-4 py-3 border-b border-gray-50 mb-2">
                    <p className="text-[9px] font-black uppercase text-gray-400 italic tracking-[0.2em]">
                      sua conta
                    </p>
                    <p className="text-sm font-black italic uppercase tracking-tight text-gray-900 mt-2">
                      {nomeUser}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 truncate">
                      {empresaNome}
                    </p>
                  </div>
                  <Link
                    href="/app/assessor-ia"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold italic uppercase text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <Brain size={16} /> Assessor IA
                  </Link>
                  <Link
                    href="/app/configuracoes"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold italic uppercase text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <Settings size={16} /> Configurações
                  </Link>
                  <button
                    onClick={doSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black italic uppercase text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut size={16} /> Sair do sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="xl:hidden border-t border-gray-100 bg-white/90 backdrop-blur-2xl">
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-2">
              <NavItem
                href="/app"
                active={isActive("/app")}
                icon={<Home size={18} />}
                label="Dashboard"
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/app/caixa-entrada"
                active={isActive("/app/caixa-entrada")}
                icon={<Inbox size={18} />}
                label="Inbox"
                badge={inboxCount}
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/app/compras"
                active={isActive("/app/compras")}
                icon={<ShoppingCart size={18} />}
                label="Compras"
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/app/financeiro"
                active={isActive("/app/financeiro")}
                icon={<DollarSign size={18} />}
                label="Financeiro"
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/app/estoque"
                active={isActive("/app/estoque")}
                icon={<Package size={18} />}
                label="Estoque"
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/app/precificacao"
                active={isActive("/app/precificacao")}
                icon={<Calculator size={18} />}
                label="Eng. Preços"
                onClick={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}
      </header>
      <main className="max-w-[1600px] mx-auto px-6 py-6 md:px-8 md:py-8 animate-in fade-in duration-500">
        {children}
      </main>
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
    </div>
  );
}

function NavItem({
  href,
  active,
  icon,
  label,
  badge = 0,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-5 py-3 rounded-[22px] transition-all duration-300 ${
        active
          ? "bg-white text-orange-600 font-black italic shadow-md shadow-orange-100/50 border border-orange-50"
          : "text-gray-400 hover:text-gray-700 hover:bg-white/60"
      }`}
    >
      <span className={active ? "text-orange-600" : "text-gray-400"}>
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-[0.2em] font-black leading-none">
        {label}
      </span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-4 ring-gray-50 shadow-lg">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ===================================================================
// 3. EXPORTAÇÃO PRINCIPAL DO LAYOUT
// Este é o componente que o Next.js usará como layout para a rota /app
// ===================================================================

export default function LayoutParaAreaLogada({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AppAuthProvider>
  );
}

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Home, ShoppingCart, DollarSign, Package, LayoutDashboard, LogOut, Sparkles } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  // CORREÇÃO: Trocamos 'signOut' por 'logout'
  const { localUser, logout } = useAppAuth();
  const pathname = usePathname();
  const bannerUrl = "/banner.png";

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          
          {/* Logo + Nome Dinâmico da Empresa do Cliente */}
          <div className="flex items-center gap-4">
            <Link href="/app" className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-lg shadow-orange-200">
           <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain brightness-0 invert" />
            </Link>
            <div>
              <span className="text-xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent leading-none block">
                {localUser?.nome_empresa || "Pappi Gestor"}
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">SaaS Inteligente</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-gray-50 p-1.5 rounded-[22px] border border-gray-100">
            <NavItem href="/app" active={pathname === "/app"} icon={<Home size={18}/>} label="Início" />
            <NavItem href="/app/compras" active={pathname.startsWith("/app/compras")} icon={<ShoppingCart size={18}/>} label="Compras" />
            <NavItem href="/app/financeiro" active={pathname.startsWith("/app/financeiro")} icon={<DollarSign size={18}/>} label="Financeiro" />
            <NavItem href="/app/estoque" active={pathname.startsWith("/app/estoque")} icon={<Package size={18}/>} label="Estoque" />
            <NavItem href="/app/dashboard" active={pathname.startsWith("/app/dashboard")} icon={<LayoutDashboard size={18}/>} label="Relatórios" />
          </nav>

          <div className="flex items-center gap-5">
            <div className="hidden md:block text-right">
              <p className="text-xs font-black italic uppercase tracking-tighter text-gray-900">{localUser?.nome}</p>
              <div className="flex justify-end items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-[9px] uppercase tracking-widest text-orange-600 font-black italic">Acesso {localUser?.nivel_acesso}</p>
              </div>
            </div>

            <div className="group relative">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-gray-900 to-gray-800 shadow-xl flex items-center justify-center text-white font-black italic text-xl cursor-pointer border-4 border-white transition-transform group-hover:scale-105 active:scale-95">
                {localUser?.nome?.charAt(0) || "P"}
              </div>
              <div className="absolute right-0 mt-4 w-60 bg-white rounded-[30px] shadow-2xl border border-gray-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto p-4 translate-y-2 group-hover:translate-y-0 z-50">
                 <p className="px-2 text-[9px] font-black uppercase text-gray-400 italic tracking-widest mb-3">Opções da Unidade</p>
                 <Link href="/app/configuracoes" className="block px-4 py-3 text-[10px] font-black uppercase italic text-gray-600 hover:bg-orange-50 rounded-xl transition-all">Ajustes da Empresa</Link>
                 
                 {/* CORREÇÃO: Trocamos 'signOut()' por 'logout()' */}
                 <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 mt-1 text-[10px] font-black uppercase italic text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <LogOut size={14} /> Sair do Sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        {children}
      </main>

      <Link href="/app/assessor-ia" className="fixed bottom-10 right-10 group z-50">
        <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <button className="relative w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-600 rounded-[30px] shadow-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:-rotate-6 active:scale-90 border-2 border-white/20">
          <Sparkles size={32} className="animate-pulse" />
        </button>
      </Link>
    </div>
  );
}

function NavItem({ href, active, icon, label }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-orange-600 font-black italic shadow-xl shadow-orange-100/50 border border-gray-100 scale-105' : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'}`}>
      <span>{icon}</span>
      <span className="text-[11px] uppercase tracking-widest italic">{label}</span>
    </Link>
  );
}
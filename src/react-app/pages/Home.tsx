"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/react-app/components/ui/dialog";

import {
  ShoppingCart,
  Calculator,
  BarChart3,
  PackageCheck,
  Users,
  Building2,
  Package,
  Truck,
  Box,
  ClipboardList,
  Gift,
  Copy,
  Check,
  Settings,
  FileText,
  MessageSquare,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Clock,
  Pencil,
  Plus,
  DollarSign,
  ArrowRight,
  Brain,
  Crown,
} from "lucide-react";

import { useAppAuthOptional } from "@/contexts/AppAuthContext";
import { NIVEL_LABELS } from "@/react-app/types/auth";

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: ElementType;
  gradient: string;
  shadowColor: string;
  roles: string[];
  featured?: boolean;
}

type NeedItem = {
  produto_id: string;
  produto: string;
  quantidade: number;
  unidade: string;
};

const ALL_MODULES: ModuleCard[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Indicadores e visão geral",
    href: "/app/dashboard",
    icon: BarChart3,
    gradient: "from-amber-500 to-yellow-500",
    shadowColor: "shadow-amber-500/30",
    roles: ["financeiro", "admin", "dono"],
    featured: true,
  },
  {
    id: "estoque",
    title: "Estoque",
    description: "Entradas, saídas e alertas",
    href: "/app/estoque",
    icon: Package,
    gradient: "from-cyan-500 to-teal-500",
    shadowColor: "shadow-cyan-500/30",
    roles: ["operador", "comprador", "admin", "dono"],
    featured: true,
  },
  {
    id: "compras",
    title: "Compras IA",
    description: "Planejamento e provisão",
    href: "/app/compras",
    icon: Sparkles,
    gradient: "from-orange-500 to-amber-500",
    shadowColor: "shadow-orange-500/30",
    roles: ["comprador", "admin", "dono"],
    featured: true,
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Pagamentos, caixa e boletos",
    href: "/app/financeiro",
    icon: Calculator,
    gradient: "from-rose-500 to-red-500",
    shadowColor: "shadow-rose-500/30",
    roles: ["financeiro", "admin", "dono"],
    featured: true,
  },
  {
    id: "comprador",
    title: "Nova Compra",
    description: "Lançamento manual",
    href: "/app/comprador",
    icon: ShoppingCart,
    gradient: "from-pink-500 to-rose-500",
    shadowColor: "shadow-pink-500/30",
    roles: ["comprador", "admin", "dono"],
  },
  {
    id: "compra-mercado",
    title: "Compra Mercado",
    description: "Operação prática do dia",
    href: "/app/compra-mercado",
    icon: ShoppingCart,
    gradient: "from-fuchsia-500 to-pink-500",
    shadowColor: "shadow-fuchsia-500/30",
    roles: ["operador", "comprador", "admin", "dono"],
  },
  {
    id: "recebimento",
    title: "Recebimento",
    description: "Conferir entregas",
    href: "/app/recebimento",
    icon: PackageCheck,
    gradient: "from-emerald-500 to-green-500",
    shadowColor: "shadow-emerald-500/30",
    roles: ["operador", "comprador", "admin", "dono"],
  },
  {
    id: "lista-compras",
    title: "Lista Compras",
    description: "Necessidades pendentes",
    href: "/app/lista-compras",
    icon: ClipboardList,
    gradient: "from-indigo-500 to-blue-500",
    shadowColor: "shadow-indigo-500/30",
    roles: ["operador", "comprador", "admin", "dono"],
  },
  {
    id: "boletos-dda",
    title: "Boletos DDA",
    description: "Visualização dos boletos",
    href: "/app/boletos-dda",
    icon: DollarSign,
    gradient: "from-red-500 to-orange-500",
    shadowColor: "shadow-red-500/30",
    roles: ["financeiro", "admin", "dono"],
  },
  {
    id: "open-finance",
    title: "Open Finance",
    description: "Conexões e visão bancária",
    href: "/app/open-finance",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/30",
    roles: ["financeiro", "admin", "dono"],
  },
  {
    id: "cotacao",
    title: "Cotação",
    description: "Comparar preços",
    href: "/app/cotacao",
    icon: FileText,
    gradient: "from-violet-500 to-purple-500",
    shadowColor: "shadow-violet-500/30",
    roles: ["comprador", "admin", "dono"],
  },
  {
    id: "ranking-fornecedores",
    title: "Ranking Preços",
    description: "Oportunidades de economia",
    href: "/app/ranking-fornecedores",
    icon: Crown,
    gradient: "from-purple-500 to-fuchsia-500",
    shadowColor: "shadow-purple-500/30",
    roles: ["comprador", "financeiro", "admin", "dono"],
  },
  {
    id: "fornecedores",
    title: "Fornecedores",
    description: "Cadastro e parceiros",
    href: "/app/fornecedores",
    icon: Truck,
    gradient: "from-sky-500 to-cyan-500",
    shadowColor: "shadow-sky-500/30",
    roles: ["comprador", "admin", "dono"],
  },
  {
    id: "produtos",
    title: "Produtos",
    description: "Gestão dos itens",
    href: "/app/produtos",
    icon: Box,
    gradient: "from-pink-500 to-rose-500",
    shadowColor: "shadow-pink-500/30",
    roles: ["operador", "comprador", "admin", "dono"],
  },
  {
    id: "produtos-master",
    title: "Catálogo Master",
    description: "Base principal",
    href: "/app/produtos-master",
    icon: Box,
    gradient: "from-slate-500 to-zinc-500",
    shadowColor: "shadow-slate-500/30",
    roles: ["comprador", "admin", "dono"],
  },
  {
    id: "catalogo-global",
    title: "Catálogo Global",
    description: "Referência global",
    href: "/app/catalogo-global",
    icon: Box,
    gradient: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/30",
    roles: ["admin", "dono"],
  },
  {
    id: "assessor-ia",
    title: "Assessor IA",
    description: "Análises e apoio inteligente",
    href: "/app/assessor-ia",
    icon: Brain,
    gradient: "from-purple-500 to-fuchsia-500",
    shadowColor: "shadow-purple-500/30",
    roles: ["comprador", "financeiro", "admin", "dono"],
  },
  {
    id: "caixa-entrada",
    title: "Caixa Entrada",
    description: "Arquivos e documentos",
    href: "/app/caixa-entrada",
    icon: MessageSquare,
    gradient: "from-green-500 to-emerald-500",
    shadowColor: "shadow-green-500/30",
    roles: ["comprador", "financeiro", "admin", "dono"],
  },
  {
    id: "equipe",
    title: "Equipe",
    description: "Time e acessos",
    href: "/app/equipe",
    icon: Users,
    gradient: "from-blue-500 to-indigo-500",
    shadowColor: "shadow-blue-500/30",
    roles: ["admin", "dono"],
  },
  {
    id: "usuarios",
    title: "Usuários",
    description: "Permissões e gestão",
    href: "/app/usuarios",
    icon: Users,
    gradient: "from-indigo-500 to-violet-500",
    shadowColor: "shadow-indigo-500/30",
    roles: ["admin", "dono"],
  },
  {
    id: "aprovacoes",
    title: "Aprovações",
    description: "Pendências administrativas",
    href: "/app/aprovacoes",
    icon: Clock,
    gradient: "from-yellow-500 to-orange-500",
    shadowColor: "shadow-yellow-500/30",
    roles: ["admin", "dono"],
  },
  {
    id: "empresas",
    title: "Empresas",
    description: "Estrutura e contas",
    href: "/app/empresas",
    icon: Building2,
    gradient: "from-slate-500 to-gray-500",
    shadowColor: "shadow-slate-500/30",
    roles: ["admin", "dono"],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "IA, DDA e ajustes",
    href: "/app/configuracoes",
    icon: Settings,
    gradient: "from-gray-500 to-zinc-500",
    shadowColor: "shadow-gray-500/30",
    roles: ["admin", "dono"],
  },
];

function getDefaultShortcutsByRole(role?: string | null): string[] {
  switch (role) {
    case "operador":
      return ["estoque", "compra-mercado", "recebimento", "lista-compras"];
    case "comprador":
      return ["compras", "compra-mercado", "cotacao", "fornecedores"];
    case "financeiro":
      return ["financeiro", "dashboard", "boletos-dda", "open-finance"];
    case "admin":
      return ["dashboard", "financeiro", "estoque", "assessor-ia"];
    case "dono":
      return ["dashboard", "financeiro", "compras", "assessor-ia"];
    default:
      return ["dashboard", "estoque", "compras", "financeiro"];
  }
}

function ModuleGridCard({ module }: { module: ModuleCard }) {
  const Icon = module.icon;

  return (
    <Link
      href={module.href}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%)]" />
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${module.gradient} opacity-10 blur-2xl transition-all duration-300 group-hover:opacity-20`}
      />

      <div
        className={`relative mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${module.gradient} shadow-lg ${module.shadowColor}`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      <div className="relative">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{module.title}</h3>
        <p className="mt-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
          {module.description}
        </p>
      </div>

      <div className="relative mt-3 flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
        Abrir <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const auth = useAppAuthOptional();
  const localUser = auth?.localUser ?? null;

  const role = localUser?.nivel_acesso ?? null;

  const [copiado, setCopiado] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [quickShortcutIds, setQuickShortcutIds] = useState<string[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const [boletosAlerta, setBoletosAlerta] = useState<{
    vencidos: number;
    totalVencidos: number;
    vencendoHoje: number;
    totalVencendoHoje: number;
    vencendo7Dias: number;
    totalVencendo7Dias: number;
  } | null>(null);

  const [validadeAlerta, setValidadeAlerta] = useState<{
    vencidos: number;
    vencendo7Dias: number;
    vencendo30Dias: number;
  } | null>(null);

  const [precosAlerta, setPrecosAlerta] = useState<{
    alertas: Array<{
      tipo: "acima" | "abaixo";
      produto_nome: string;
      fornecedor_nome: string;
      variacao_percentual: number;
      preco_atual: number;
      preco_medio: number;
    }>;
    total: number;
    acima_media: number;
    abaixo_media: number;
  } | null>(null);

  const [stats, setStats] = useState({ pedidosHoje: 0, aPagar: 0, entregas: 0 });

  const necessidades = useMemo<NeedItem[]>(() => [], []);

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      const currentRole = localUser?.nivel_acesso;
      if (!currentRole) return false;
      return roles.includes(currentRole);
    },
    [localUser?.nivel_acesso]
  );

  const availableModules = useMemo(
    () => ALL_MODULES.filter((m) => hasAnyRole(m.roles)),
    [hasAnyRole]
  );

  const availableQuickModules = availableModules;

  const shortcutModules = useMemo(() => {
    const list = quickShortcutIds
      .map((id) => ALL_MODULES.find((m) => m.id === id))
      .filter((m): m is ModuleCard => !!m && hasAnyRole(m.roles));

    while (list.length < 4) list.push(undefined as unknown as ModuleCard);
    return list.slice(0, 4);
  }, [quickShortcutIds, hasAnyRole]);

  const featuredModules = useMemo(
    () => ALL_MODULES.filter((m) => m.featured && hasAnyRole(m.roles)),
    [hasAnyRole]
  );

  const operationModules = useMemo(
    () =>
      ALL_MODULES.filter(
        (m) =>
          [
            "comprador",
            "compra-mercado",
            "recebimento",
            "lista-compras",
            "cotacao",
            "fornecedores",
            "produtos",
          ].includes(m.id) && hasAnyRole(m.roles)
      ),
    [hasAnyRole]
  );

  const managementModules = useMemo(
    () =>
      ALL_MODULES.filter(
        (m) =>
          [
            "assessor-ia",
            "caixa-entrada",
            "ranking-fornecedores",
            "boletos-dda",
            "open-finance",
            "equipe",
            "usuarios",
            "aprovacoes",
            "configuracoes",
            "catalogo-global",
            "produtos-master",
            "empresas",
          ].includes(m.id) && hasAnyRole(m.roles)
      ),
    [hasAnyRole]
  );

  const linkIndicacao = useMemo(
    () => `https://dqifkajp3lsn2.mocha.app/cadastro?ref=${localUser?.id || ""}`,
    [localUser?.id]
  );

  const copiarLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(linkIndicacao);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const saveShortcuts = useCallback(
    async (ids: string[]) => {
      const next = ids.slice(0, 4);
      setQuickShortcutIds(next);

      if (!localUser?.id) return;

      try {
        const empresaId =
          typeof (localUser as any).empresaId === "string"
            ? (localUser as any).empresaId
            : typeof (localUser as any).empresa_id === "string"
              ? (localUser as any).empresa_id
              : null;

        await fetch("/api/home-preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: localUser.id,
            empresaId,
            quickShortcuts: next,
          }),
        });
      } catch (error) {
        console.error("Erro ao salvar preferências da home:", error);
      }
    },
    [localUser]
  );

  const handleSelectModule = async (moduleId: string) => {
    if (editingSlot === null) return;

    const next = [...quickShortcutIds];
    const existingIndex = next.indexOf(moduleId);

    if (existingIndex !== -1 && existingIndex !== editingSlot) {
      next[existingIndex] = next[editingSlot] || "";
    }

    next[editingSlot] = moduleId;

    await saveShortcuts(next.filter(Boolean));
    setEditingSlot(null);
    setShowEditor(false);
  };

  const fetchAlertas = useCallback(async () => {
    try {
      const [lancRes, validadeRes, precosRes] = await Promise.all([
        fetch("/api/lancamentos"),
        fetch("/api/estoque/alertas-validade"),
        fetch("/api/alertas-precos"),
      ]);

      if (precosRes.ok) {
        const precosData = await precosRes.json();
        setPrecosAlerta(precosData);
      }

      if (validadeRes.ok) {
        const validadeData = await validadeRes.json();
        setValidadeAlerta({
          vencidos: validadeData.vencidos?.count || 0,
          vencendo7Dias: validadeData.vencendo_7dias?.count || 0,
          vencendo30Dias: validadeData.vencendo_30dias?.count || 0,
        });
      }

      if (lancRes.ok) {
        const lancamentos = await lancRes.json();

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const em7Dias = new Date(hoje);
        em7Dias.setDate(em7Dias.getDate() + 7);

        const naoPagos = (lancamentos as any[]).filter(
          (l: any) => !l.data_pagamento && l.is_boleto_recebido
        );

        const vencidos = naoPagos.filter((l: any) => {
          if (!l.vencimento_real) return false;
          const venc = new Date(l.vencimento_real);
          venc.setHours(0, 0, 0, 0);
          return venc < hoje;
        });

        const vencendoHoje = naoPagos.filter((l: any) => {
          if (!l.vencimento_real) return false;
          const venc = new Date(l.vencimento_real);
          venc.setHours(0, 0, 0, 0);
          return venc.getTime() === hoje.getTime();
        });

        const vencendo7Dias = naoPagos.filter((l: any) => {
          if (!l.vencimento_real) return false;
          const venc = new Date(l.vencimento_real);
          venc.setHours(0, 0, 0, 0);
          return venc > hoje && venc <= em7Dias;
        });

        setBoletosAlerta({
          vencidos: vencidos.length,
          totalVencidos: vencidos.reduce(
            (acc: number, l: any) => acc + (l.valor_real || l.valor_previsto),
            0
          ),
          vencendoHoje: vencendoHoje.length,
          totalVencendoHoje: vencendoHoje.reduce(
            (acc: number, l: any) => acc + (l.valor_real || l.valor_previsto),
            0
          ),
          vencendo7Dias: vencendo7Dias.length,
          totalVencendo7Dias: vencendo7Dias.reduce(
            (acc: number, l: any) => acc + (l.valor_real || l.valor_previsto),
            0
          ),
        });

        const hojeStr = hoje.toISOString().split("T")[0];
        const pedidosHoje = (lancamentos as any[]).filter((l: any) => l.data_pedido === hojeStr).length;
        const aPagar = naoPagos.length;
        const entregas = (lancamentos as any[]).filter(
          (l: any) => !l.data_recebimento && l.is_boleto_recebido
        ).length;

        setStats({ pedidosHoje, aPagar, entregas });
      }
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!localUser?.id) return;

      try {
        const response = await fetch(
          `/api/home-preferences?userId=${encodeURIComponent(localUser.id)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Falha ao carregar preferências");
        }

        const result = await response.json();
        const saved = result?.preference?.quick_shortcuts;

        if (Array.isArray(saved) && saved.length > 0) {
          const validSaved = saved.filter((id: string) =>
            availableQuickModules.some((m) => m.id === id)
          );

          if (validSaved.length > 0) {
            setQuickShortcutIds(validSaved.slice(0, 4));
            return;
          }
        }
      } catch (error) {
        console.error("Erro ao carregar preferências da home:", error);
      }

      const defaults = getDefaultShortcutsByRole(role).filter((id) =>
        availableQuickModules.some((m) => m.id === id)
      );

      const fallback = [...defaults];
      for (const mod of availableQuickModules) {
        if (fallback.length >= 4) break;
        if (!fallback.includes(mod.id)) fallback.push(mod.id);
      }

      setQuickShortcutIds(fallback.slice(0, 4));
    };

    loadPreferences();
  }, [localUser?.id, role, availableQuickModules]);

  return (
    <div className="space-y-5">
  
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-5 text-white shadow-[0_20px_60px_rgba(249,115,22,0.28)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
              central inteligente
            </p>
            <h1 className="mt-1 text-xl font-black leading-tight">
              Olá, {localUser?.nome?.split(" ")[0] || "Gestor"}!
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {localUser?.nivel_acesso ? NIVEL_LABELS[localUser.nivel_acesso] : ""}
              {(localUser as any)?.empresa_nome ? ` • ${(localUser as any).empresa_nome}` : ""}
            </p>
            <p className="mt-3 max-w-[240px] text-xs leading-5 text-white/85">
              Controle compras, estoque e financeiro com uma experiência que convida a explorar.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-lg font-black shadow-lg backdrop-blur-sm">
            {localUser?.nome?.charAt(0)?.toUpperCase() || "P"}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-lg font-black">{stats.pedidosHoje}</span>
            </div>
            <p className="mt-1 text-[10px] text-white/75">Pedidos hoje</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-lg font-black">{stats.aPagar}</span>
            </div>
            <p className="mt-1 text-[10px] text-white/75">A pagar</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-lg font-black">{stats.entregas}</span>
            </div>
            <p className="mt-1 text-[10px] text-white/75">Entregas</p>
          </div>
        </div>
      </section>

      {featuredModules.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-white">
              Centrais do negócio
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Os módulos mais importantes para decidir rápido
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featuredModules.map((module) => (
              <ModuleGridCard key={module.id} module={module} />
            ))}
          </div>
        </section>
      )}

      <Card className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm dark:border-orange-900 dark:from-orange-950/40 dark:to-amber-950/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-zinc-900 dark:text-white">
            ⚠️ Itens para comprar
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {necessidades.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Estoque saudável</p>
          )}

          <Button
            className="mt-2 h-11 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            onClick={() => router.push("/app/lista-compras")}
          >
            Gerenciar compras
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-white">Acesso rápido</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Seus atalhos pessoais, salvos na sua conta
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowEditor(true);
              setEditingSlot(null);
            }}
            className="h-8 rounded-xl px-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {shortcutModules.slice(0, 4).map((card, index) => {
            if (!card) {
              return (
                <button
                  key={`empty-${index}`}
                  onClick={() => {
                    setShowEditor(true);
                    setEditingSlot(index);
                  }}
                  className="flex min-h-[118px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 text-zinc-400 transition-all hover:border-orange-400 hover:bg-orange-50 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <Plus className="h-8 w-8" />
                  <span className="mt-2 text-xs font-medium">Adicionar</span>
                </button>
              );
            }

            const Icon = card.icon;

            return (
              <Link
                key={card.id}
                href={card.href}
                className="group relative min-h-[118px] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl`} />
                <div
                  className={`relative mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadowColor}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="relative text-sm font-black text-zinc-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="relative mt-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {operationModules.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-white">Operação e compras</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Fluxo diário da empresa
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {operationModules.map((module) => (
              <ModuleGridCard key={module.id} module={module} />
            ))}
          </div>
        </section>
      )}

      {managementModules.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-white">Gestão e inteligência</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Administração, análise e automação
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {managementModules.map((module) => (
              <ModuleGridCard key={module.id} module={module} />
            ))}
          </div>
        </section>
      )}

      <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_18px_45px_rgba(16,185,129,0.25)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Gift className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black">Indique e Ganhe R$ 20</h3>
              <p className="text-xs text-emerald-100">Convide comerciantes e ganhe crédito</p>
            </div>

            <Button
              onClick={copiarLink}
              size="sm"
              className="h-10 rounded-xl bg-white px-3 font-bold text-emerald-600 hover:bg-emerald-50"
            >
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm dark:border-purple-900 dark:from-purple-950 dark:to-fuchsia-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>

            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                Dica do dia: use o Assessor IA
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                Tire foto de notas e documentos para acelerar o lançamento e ganhar produtividade.
              </p>
              <Link
                href="/app/assessor-ia"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Experimentar agora <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-h-[84vh] max-w-lg overflow-y-auto rounded-[28px] border-0 bg-white p-0 shadow-[0_30px_80px_rgba(0,0,0,0.16)] dark:bg-zinc-950">
          <DialogHeader className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-zinc-900 dark:text-white">
              <Settings className="h-4 w-4" />
              {editingSlot !== null ? "Escolher módulo" : "Todos os módulos"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4">
            {editingSlot === null && (
              <div className="mb-4">
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">Seus atalhos atuais:</p>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((index) => {
                    const moduleId = quickShortcutIds[index];
                    const module = ALL_MODULES.find((m) => m.id === moduleId);

                    return (
                      <button
                        key={index}
                        onClick={() => setEditingSlot(index)}
                        className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-2 transition-all hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        {module ? (
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${module.gradient}`}
                            >
                              <module.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="mt-1 w-full truncate text-center text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                              {module.title}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-1">
                            <Plus className="h-6 w-6 text-zinc-300" />
                            <span className="mt-1 text-[10px] text-zinc-400">Vazio</span>
                          </div>
                        )}

                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                          <Pencil className="h-2 w-2 text-white" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-center text-xs text-zinc-400">
                  Clique em um atalho para trocar
                </p>
              </div>
            )}

            <div className="space-y-2">
              {editingSlot !== null && (
                <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Escolha o módulo para a posição {editingSlot + 1}:
                </p>
              )}

              {availableModules.map((module) => {
                const Icon = module.icon;
                const isSelected = quickShortcutIds.includes(module.id);
                const slotIndex = quickShortcutIds.indexOf(module.id);

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      if (editingSlot !== null) {
                        handleSelectModule(module.id);
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 transition-all ${
                      isSelected
                        ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40"
                        : "border-zinc-200 bg-white hover:border-orange-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${module.gradient} shadow ${module.shadowColor}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{module.title}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{module.description}</p>
                    </div>

                    {isSelected && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                        {slotIndex + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {editingSlot !== null && (
              <Button variant="outline" onClick={() => setEditingSlot(null)} className="mt-4 w-full rounded-2xl">
                Cancelar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
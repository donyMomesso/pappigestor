"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Package,
  Inbox,
  Brain,
  BarChart3,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
  Trophy,
  CheckCircle2,
  Zap,
  Crown,
  ChevronRight,
  Truck,
  Boxes,
  Settings,
  Users,
  CreditCard,
  Pencil,
  Plus,
  QrCode,
  ListTodo,
  FileSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Feature, NivelAcesso } from "@/react-app/types/auth";
import { PREMIUM_FEATURES } from "@/react-app/types/auth";

interface LancamentoResumo {
  data_pagamento?: string | null;
  is_boleto_recebido?: boolean;
  vencimento_real?: string | null;
  valor_real?: number | null;
  valor_previsto?: number | null;
  data_pedido?: string | null;
  data_recebimento?: string | null;
}

interface PrecoAlerta {
  tipo: "acima" | "abaixo";
  produto_nome: string;
  fornecedor_nome: string;
  variacao_percentual: number;
  preco_atual: number;
  preco_medio: number;
}

interface PrecosAlerta {
  alertas: PrecoAlerta[];
  total: number;
  acima_media: number;
  abaixo_media: number;
}

interface ValidadeAlerta {
  vencidos: number;
  vencendo7Dias: number;
  vencendo30Dias: number;
}

interface BoletosAlerta {
  vencidos: number;
  totalVencidos: number;
  vencendoHoje: number;
  totalVencendoHoje: number;
  vencendo7Dias: number;
  totalVencendo7Dias: number;
}

interface SpotlightCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  roles: NivelAcesso[];
  feature?: Feature;
  badge?: string;
}

interface QuickModule {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  roles: NivelAcesso[];
  feature?: Feature;
  color: string;
}

const spotlightCards: SpotlightCard[] = [
  {
    title: "Caixa de Entrada",
    description: "Arquivos, documentos e entradas organizadas em um fluxo prático.",
    href: "/app/caixa-entrada",
    icon: Inbox,
    roles: ["comprador", "financeiro", "admin", "dono"],
    feature: "caixa_entrada",
    badge: "Fluxo",
  },
  {
    title: "Assessor IA",
    description: "Análises rápidas, inteligência aplicada e apoio para decidir melhor.",
    href: "/app/assessor-ia",
    icon: Brain,
    roles: ["comprador", "financeiro", "admin", "dono"],
    feature: "assessor_ia",
    badge: "IA",
  },
  {
    title: "Nova Compra",
    description: "Comece uma compra e acelere o giro da operação.",
    href: "/app/comprador",
    icon: ShoppingCart,
    roles: ["comprador", "admin", "dono"],
    badge: "Ação",
  },
  {
    title: "Precificação",
    description: "Entenda margem, ajuste preço e proteja resultado.",
    href: "/app/precificacao",
    icon: BarChart3,
    roles: ["financeiro", "admin", "dono"],
    badge: "Margem",
  },
];

const ALL_QUICK_MODULES: QuickModule[] = [
  {
    id: "comprador",
    title: "Comprar",
    href: "/app/comprador",
    icon: ShoppingCart,
    roles: ["comprador", "admin", "dono"],
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "recebimento",
    title: "Receber",
    href: "/app/recebimento",
    icon: Truck,
    roles: ["operador", "comprador", "admin", "dono"],
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "financeiro",
    title: "Financeiro",
    href: "/app/financeiro",
    icon: DollarSign,
    roles: ["financeiro", "admin", "dono"],
    color: "bg-rose-50 text-rose-600",
  },
  {
    id: "estoque",
    title: "Estoque",
    href: "/app/estoque",
    icon: Boxes,
    roles: ["operador", "comprador", "admin", "dono"],
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "precificacao",
    title: "Precificação",
    href: "/app/precificacao",
    icon: BarChart3,
    roles: ["financeiro", "admin", "dono"],
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    id: "usuarios",
    title: "Usuários",
    href: "/app/usuarios",
    icon: Users,
    roles: ["admin", "dono"],
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    href: "/app/configuracoes",
    icon: Settings,
    roles: ["admin", "dono"],
    color: "bg-slate-50 text-slate-700",
  },
  {
    id: "boletos-dda",
    title: "Boletos DDA",
    href: "/app/boletos-dda",
    icon: CreditCard,
    roles: ["financeiro", "admin", "dono"],
    feature: "dda",
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: "caixa-entrada",
    title: "Entrada",
    href: "/app/caixa-entrada",
    icon: Inbox,
    roles: ["comprador", "financeiro", "admin", "dono"],
    feature: "caixa_entrada",
    color: "bg-green-50 text-green-600",
  },
  {
    id: "lista-compras",
    title: "Lista Compras",
    href: "/app/lista-compras",
    icon: ListTodo,
    roles: ["operador", "comprador", "admin", "dono"],
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    id: "compra-mercado",
    title: "Compra Mercado",
    href: "/app/compra-mercado",
    icon: QrCode,
    roles: ["operador", "comprador", "admin", "dono"],
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    id: "cotacao",
    title: "Cotações",
    href: "/app/cotacao",
    icon: FileSearch,
    roles: ["comprador", "admin", "dono"],
    feature: "cotacao",
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/app/dashboard",
    icon: TrendingUp,
    roles: ["financeiro", "admin", "dono"],
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "equipe",
    title: "Equipe",
    href: "/app/equipe",
    icon: Users,
    roles: ["admin", "dono"],
    color: "bg-blue-50 text-blue-600",
  },
];

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function hasPremiumBadge(feature?: Feature) {
  return !!feature && PREMIUM_FEATURES.includes(feature);
}

function getDefaultShortcutsByRole(role?: NivelAcesso): string[] {
  switch (role) {
    case "comprador":
      return ["comprador", "recebimento", "estoque", "cotacao"];
    case "financeiro":
      return ["financeiro", "boletos-dda", "dashboard", "precificacao"];
    case "operador":
      return ["recebimento", "estoque", "lista-compras", "compra-mercado"];
    case "admin":
    case "dono":
      return ["dashboard", "financeiro", "usuarios", "configuracoes"];
    default:
      return ["dashboard", "estoque", "financeiro", "configuracoes"];
  }
}

export default function AppHomePage() {
  const { localUser, hasRole, hasFeature } = useAppAuth();

  const [stats, setStats] = useState({
    pedidosHoje: 0,
    aPagar: 0,
    entregasPendentes: 0,
  });

  const [boletos, setBoletos] = useState<BoletosAlerta | null>(null);
  const [validade, setValidade] = useState<ValidadeAlerta | null>(null);
  const [precos, setPrecos] = useState<PrecosAlerta | null>(null);

  const [showShortcutEditor, setShowShortcutEditor] = useState(false);
  const [quickShortcutIds, setQuickShortcutIds] = useState<string[]>([]);

  const role = localUser?.nivel_acesso;
  const storageKey = `pappi_home_shortcuts_${localUser?.id || "anon"}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lancRes, validadeRes, precosRes] = await Promise.all([
          fetch("/api/lancamentos", { cache: "no-store" }),
          fetch("/api/estoque/alertas-validade", { cache: "no-store" }),
          fetch("/api/alertas-precos", { cache: "no-store" }),
        ]);

        if (validadeRes.ok) {
          const validadeData = await validadeRes.json();
          setValidade({
            vencidos: Number(validadeData?.vencidos?.count || 0),
            vencendo7Dias: Number(validadeData?.vencendo_7dias?.count || 0),
            vencendo30Dias: Number(validadeData?.vencendo_30dias?.count || 0),
          });
        }

        if (precosRes.ok) {
          const precosData = (await precosRes.json()) as PrecosAlerta;
          setPrecos(precosData);
        }

        if (lancRes.ok) {
          const lancamentos = (await lancRes.json()) as LancamentoResumo[];

          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const em7Dias = new Date(hoje);
          em7Dias.setDate(em7Dias.getDate() + 7);

          const naoPagos = lancamentos.filter(
            (l) => !l.data_pagamento && !!l.is_boleto_recebido
          );

          const vencidos = naoPagos.filter((l) => {
            if (!l.vencimento_real) return false;
            const venc = new Date(l.vencimento_real);
            venc.setHours(0, 0, 0, 0);
            return venc < hoje;
          });

          const vencendoHoje = naoPagos.filter((l) => {
            if (!l.vencimento_real) return false;
            const venc = new Date(l.vencimento_real);
            venc.setHours(0, 0, 0, 0);
            return venc.getTime() === hoje.getTime();
          });

          const vencendo7Dias = naoPagos.filter((l) => {
            if (!l.vencimento_real) return false;
            const venc = new Date(l.vencimento_real);
            venc.setHours(0, 0, 0, 0);
            return venc > hoje && venc <= em7Dias;
          });

          setBoletos({
            vencidos: vencidos.length,
            totalVencidos: vencidos.reduce(
              (acc, l) => acc + Number(l.valor_real || l.valor_previsto || 0),
              0
            ),
            vencendoHoje: vencendoHoje.length,
            totalVencendoHoje: vencendoHoje.reduce(
              (acc, l) => acc + Number(l.valor_real || l.valor_previsto || 0),
              0
            ),
            vencendo7Dias: vencendo7Dias.length,
            totalVencendo7Dias: vencendo7Dias.reduce(
              (acc, l) => acc + Number(l.valor_real || l.valor_previsto || 0),
              0
            ),
          });

          const hojeStr = hoje.toISOString().split("T")[0];
          setStats({
            pedidosHoje: lancamentos.filter((l) => l.data_pedido === hojeStr).length,
            aPagar: naoPagos.length,
            entregasPendentes: lancamentos.filter(
              (l) => !l.data_recebimento && !!l.is_boleto_recebido
            ).length,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar home:", error);
      }
    };

    fetchData();
  }, []);

  const availableQuickModules = useMemo(() => {
    return ALL_QUICK_MODULES.filter((item) => {
      if (!hasRole(item.roles)) return false;
      if (item.feature && !hasFeature(item.feature)) return false;
      return true;
    });
  }, [hasRole, hasFeature]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuickShortcutIds(parsed);
          return;
        }
      } catch {}
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
  }, [storageKey, role, availableQuickModules]);

  const quickModules = useMemo(() => {
    const modules = quickShortcutIds
      .map((id) => availableQuickModules.find((m) => m.id === id))
      .filter((m): m is QuickModule => !!m);

    return modules.slice(0, 4);
  }, [quickShortcutIds, availableQuickModules]);

  const saveShortcuts = (ids: string[]) => {
    const next = ids.slice(0, 4);
    setQuickShortcutIds(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const toggleShortcut = (id: string) => {
    const exists = quickShortcutIds.includes(id);

    if (exists) {
      saveShortcuts(quickShortcutIds.filter((x) => x !== id));
      return;
    }

    if (quickShortcutIds.length < 4) {
      saveShortcuts([...quickShortcutIds, id]);
      return;
    }

    saveShortcuts([...quickShortcutIds.slice(1), id]);
  };

  const nome = localUser?.nome?.split(" ")[0] || "Gestor";
  const empresaNome = localUser?.nome_empresa || "Pappi Gestor";

  const spotlightVisible = useMemo(() => {
    return spotlightCards.filter((item) => {
      if (!hasRole(item.roles)) return false;
      if (item.feature && !hasFeature(item.feature)) return false;
      return true;
    });
  }, [hasRole, hasFeature]);

  const prioridadeFinanceira = useMemo(() => {
    if (!boletos) return null;
    if (boletos.vencidos > 0) {
      return {
        title: "Atenção no financeiro",
        description: `${boletos.vencidos} vencido(s) • ${currency(boletos.totalVencidos)}`,
        href: "/app/financeiro",
        color: "from-red-500 to-red-600",
        icon: AlertTriangle,
      };
    }
    if (boletos.vencendoHoje > 0) {
      return {
        title: "Pagamentos vencem hoje",
        description: `${boletos.vencendoHoje} boleto(s) • ${currency(boletos.totalVencendoHoje)}`,
        href: "/app/financeiro",
        color: "from-orange-500 via-orange-500 to-pink-500",
        icon: Clock3,
      };
    }
    return {
      title: "Financeiro sob controle",
      description: "Sem urgência crítica no momento.",
      href: "/app/financeiro",
      color: "from-emerald-500 to-green-600",
      icon: ShieldCheck,
    };
  }, [boletos]);

  const operacaoInsight = useMemo(() => {
    if (validade && validade.vencidos > 0) {
      return {
        title: "Produtos vencidos",
        description: `${validade.vencidos} item(ns) precisam de ação.`,
        href: "/app/estoque",
        icon: Package,
      };
    }

    if (validade && validade.vencendo7Dias > 0) {
      return {
        title: "Giro de estoque",
        description: `${validade.vencendo7Dias} item(ns) vencem em até 7 dias.`,
        href: "/app/estoque",
        icon: ClipboardCheck,
      };
    }

    if (precos && precos.abaixo_media > 0) {
      return {
        title: "Economia detectada",
        description: `${precos.abaixo_media} oportunidade(s) abaixo da média.`,
        href: "/app/ranking-fornecedores",
        icon: Trophy,
      };
    }

    return {
      title: "Operação estável",
      description: "Sem alertas críticos agora.",
      href: "/app/dashboard",
      icon: CheckCircle2,
    };
  }, [validade, precos]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-950 via-orange-600 to-pink-500 text-white shadow-xl shadow-orange-500/20">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-white/10 blur-2xl" />

        <div className="relative space-y-4 p-4 sm:p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-50">
            <Sparkles className="h-3.5 w-3.5" />
            operação inteligente
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">
              Olá, {nome}.
            </h1>
            <p className="max-w-xl text-sm text-orange-50/90">
              Controle mais, perca menos e descubra oportunidades antes que elas passem.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-orange-100">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="mt-1 text-xl font-black">{stats.pedidosHoje}</div>
              <p className="text-[10px] text-orange-100/90">Pedidos</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-orange-100">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="mt-1 text-xl font-black">{stats.aPagar}</div>
              <p className="text-[10px] text-orange-100/90">A pagar</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-orange-100">
                <Truck className="h-4 w-4" />
              </div>
              <div className="mt-1 text-xl font-black">{stats.entregasPendentes}</div>
              <p className="text-[10px] text-orange-100/90">Entregas</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-orange-50/85">
            <CheckCircle2 className="h-4 w-4" />
            <span>{empresaNome} com visão central da operação.</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {prioridadeFinanceira && (
          <Link href={prioridadeFinanceira.href}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                      prioridade
                    </p>
                    <h2 className="mt-1 text-base font-black text-gray-900">
                      {prioridadeFinanceira.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {prioridadeFinanceira.description}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl bg-gradient-to-br ${prioridadeFinanceira.color} p-3 text-white shadow-md`}
                  >
                    <prioridadeFinanceira.icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
                  Abrir
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href={operacaoInsight.href}>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                    insight
                  </p>
                  <h2 className="mt-1 text-base font-black text-gray-900">
                    {operacaoInsight.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {operacaoInsight.description}
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                  <operacaoInsight.icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
                Explorar
                <ChevronRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-black text-gray-900">Acesso rápido</h2>
            <p className="text-sm text-gray-500">
              Personalizado por usuário e nível de acesso.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcutEditor(true)}
            className="gap-1.5 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickModules.map((item) => (
            <Link key={item.id} href={item.href}>
              <Card className="border-0 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className={`inline-flex rounded-2xl p-3 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-black text-gray-900">{item.title}</h3>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                    Entrar
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {quickModules.length < 4 &&
            Array.from({ length: 4 - quickModules.length }).map((_, index) => (
              <button
                key={`empty-${index}`}
                onClick={() => setShowShortcutEditor(true)}
                className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="inline-flex rounded-2xl bg-white p-3 text-orange-500 shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-black text-gray-800">Adicionar</h3>
                <div className="mt-2 text-xs font-semibold text-orange-600">
                  Escolher atalho
                </div>
              </button>
            ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-black text-gray-900">Explore o potencial do app</h2>
          <p className="text-sm text-gray-500">
            Áreas com mais valor percebido e mais impacto na rotina.
          </p>
        </div>

        <div className="grid gap-3">
          {spotlightVisible.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="border-0 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                      <item.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-gray-900">{item.title}</h3>

                        {item.badge && (
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">
                            {item.badge}
                          </span>
                        )}

                        {hasPremiumBadge(item.feature) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            <Crown className="h-3 w-3" />
                            PRO
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>

                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                        Acessar
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Card className="border-0 bg-orange-50 shadow-sm">
          <CardContent className="p-4">
            <div className="w-fit rounded-2xl bg-white p-3 text-orange-600 shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-black text-gray-900">Mais clareza</h3>
            <p className="mt-1 text-sm text-gray-600">
              O cliente entende rápido o que precisa fazer.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-orange-50 shadow-sm">
          <CardContent className="p-4">
            <div className="w-fit rounded-2xl bg-white p-3 text-orange-600 shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-black text-gray-900">Mais ação</h3>
            <p className="mt-1 text-sm text-gray-600">
              Menos confusão e mais velocidade operacional.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-orange-50 shadow-sm">
          <CardContent className="p-4">
            <div className="w-fit rounded-2xl bg-white p-3 text-orange-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-black text-gray-900">Mais segurança</h3>
            <p className="mt-1 text-sm text-gray-600">
              Riscos e oportunidades ficam visíveis mais cedo.
            </p>
          </CardContent>
        </Card>
      </section>

      <Dialog open={showShortcutEditor} onOpenChange={setShowShortcutEditor}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar acesso rápido</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {availableQuickModules.map((item) => {
              const selected = quickShortcutIds.includes(item.id);
              const isPremium = hasPremiumBadge(item.feature);

              return (
                <button
                  key={item.id}
                  onClick={() => toggleShortcut(item.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition-all ${
                    selected
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex rounded-xl p-2.5 ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.href}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Crown className="h-3 w-3" />
                        PRO
                      </span>
                    )}

                    {selected ? (
                      <span className="rounded-full bg-orange-500 px-2 py-1 text-[10px] font-bold text-white">
                        ATIVO
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">
                        ADICIONAR
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <div className="pb-6" />
    </div>
  );
}
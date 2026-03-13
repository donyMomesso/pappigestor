"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Badge } from "@/react-app/components/ui/badge";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { cn } from "@/react-app/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CreditCard,
  Crown,
  DollarSign,
  LineChart,
  Lock,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";

const premiumTabs = [
  { href: "/app/financeiro", label: "Central", icon: DollarSign },
  { href: "/app/financeiro/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/app/financeiro/fluxo-caixa", label: "Fluxo de Caixa", icon: LineChart },
  { href: "/app/financeiro/boletos", label: "Boletos", icon: CreditCard },
  { href: "/app/financeiro/insights", label: "Insights IA", icon: Brain },
  { href: "/app/financeiro/open-finance", label: "Open Finance", icon: Wallet },
];

function FinanceiroSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-40 rounded-3xl bg-zinc-100 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-zinc-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function RoleDenied() {
  return (
    <Card className="border-red-200 bg-red-50/70 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-red-100 p-3 text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Acesso restrito ao Financeiro Premium</CardTitle>
            <p className="text-sm text-zinc-600 mt-1">
              Esta área foi organizada para o perfil Financeiro e para o Dono da empresa.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/app">Voltar ao painel</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/recebimento">Ir para recebimento</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function UpgradeRequired() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-orange-50 via-white to-pink-50 shadow-sm">
        <CardContent className="p-0">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr,1fr] lg:p-8">
            <div className="space-y-4">
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                <Crown className="mr-1 h-3.5 w-3.5" />
                Módulo premium
              </Badge>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl">
                  Financeiro executivo com IA, conciliação e fluxo projetado.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 lg:text-base">
                  A nova área do financeiro foi separada como uma experiência premium. Ela reúne
                  visão executiva, alertas inteligentes, conciliação e atalhos para boletos, Open
                  Finance e recebimento sem mexer nas rotas antigas.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/app/configuracoes">
                    Ver planos e liberar módulo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/app">Voltar ao painel</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                "Fluxo de caixa previsto x realizado",
                "Alertas de vencimento e divergência",
                "Conciliação NF, boleto e lançamento",
                "Resumo inteligente com IA",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-zinc-900 p-2 text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Seu app continua intacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-600">
          <p>As páginas antigas continuam existindo. Esta nova camada só organiza o financeiro premium.</p>
          <p>Ao liberar o plano, a empresa passa a enxergar a nova central com layout próprio.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinanceiroShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { localUser, isLoading, hasFeature } = useAppAuth();

  if (isLoading) return <FinanceiroSkeleton />;

  const role = localUser?.nivel_acesso;
  const isAllowedRole = role === "financeiro" || role === "dono";
  if (!isAllowedRole) return <RoleDenied />;

  const premiumEnabled = hasFeature("dashboard_avancado") || localUser?.plano === "enterprise";
  if (!premiumEnabled) return <UpgradeRequired />;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr,1fr] lg:p-8">
          <div className="space-y-4">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              <Crown className="mr-1 h-3.5 w-3.5" />
              Financeiro premium
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                Central Financeira Pappi
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-200 lg:text-base">
                Um ambiente próprio para dono e financeiro acompanharem boletos, contas a pagar,
                fluxo de caixa e alertas operacionais com uma experiência premium.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Fluxo projetado</Badge>
              <Badge className="bg-white/10 text-white hover:bg-white/10">Conciliação</Badge>
              <Badge className="bg-white/10 text-white hover:bg-white/10">Insights IA</Badge>
              <Badge className="bg-white/10 text-white hover:bg-white/10">Open Finance</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                title: "Público",
                value: role === "dono" ? "Dono" : "Financeiro",
                icon: Crown,
              },
              {
                title: "Plano",
                value: localUser?.plano === "enterprise" ? "Enterprise" : "Profissional",
                icon: Lock,
              },
              {
                title: "Empresa",
                value: localUser?.nome_empresa || "Minha Empresa",
                icon: DollarSign,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-zinc-300">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">{item.title}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <nav className="overflow-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {premiumTabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div>{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  Boxes,
  Settings,
  Bot,
  ArrowRight,
  Trophy,
  Users,
} from "lucide-react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Button } from "@/components/ui/button";

const atalhos = [
  {
    title: "Estoque",
    href: "/app/estoque",
    icon: Package,
    desc: "Controle de insumos e visão do que está faltando.",
  },
  {
    title: "Compras",
    href: "/app/compras",
    icon: ShoppingCart,
    desc: "Reposição, pedidos e inteligência de compra.",
  },
  {
    title: "Financeiro",
    href: "/app/financeiro",
    icon: DollarSign,
    desc: "Caixa, contas e visão financeira.",
  },
  {
    title: "Recebimento",
    href: "/app/recebimento",
    icon: Truck,
    desc: "Entrada e conferência de mercadorias.",
  },
  {
    title: "Produtos",
    href: "/app/produtos",
    icon: Boxes,
    desc: "Cadastro e organização do catálogo.",
  },
  {
    title: "Configurações",
    href: "/app/configuracoes",
    icon: Settings,
    desc: "Preferências, empresa e ajustes do sistema.",
  },
  {
    title: "Assessor IA",
    href: "/app/assessor-ia",
    icon: Bot,
    desc: "Apoio inteligente para a operação.",
  },
  {
    title: "Usuários",
    href: "/app/usuarios",
    icon: Users,
    desc: "Gestão de acessos e equipe da operação.",
  },
  {
    title: "Ranking Fornecedores",
    href: "/app/ranking-fornecedores",
    icon: Trophy,
    desc: "Avaliação e comparação de fornecedores.",
  },
];

export default function AppDashboardPage() {
  const { localUser, signOut } = useAppAuth();

  const primeiroNome =
    localUser?.nome?.trim()?.split(" ")?.[0] ||
    localUser?.email?.split("@")?.[0] ||
    "Gestor";

  const empresa =
    localUser?.empresas?.nome_fantasia ||
    localUser?.empresa?.nome_fantasia ||
    localUser?.nome_empresa ||
    "Sua empresa";

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-600 italic mb-3">
              painel operacional
            </p>

            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-900">
              Olá, {primeiroNome}
            </h1>

            <p className="text-zinc-500 mt-3">
              Central de operação de {empresa}.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={signOut}
            className="rounded-2xl border-zinc-200 bg-white px-5 py-3 text-xs font-black uppercase italic text-zinc-900 hover:bg-zinc-100"
          >
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {atalhos.map(({ title, href, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5">
                <Icon size={22} />
              </div>

              <h2 className="text-xl font-black uppercase italic tracking-tight text-zinc-900">
                {title}
              </h2>

              <p className="text-sm text-zinc-500 leading-relaxed mt-2">
                {desc}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase italic text-orange-600">
                acessar
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  ShieldCheck,
  Boxes,
  ShoppingCart,
  Receipt,
  Building2,
} from "lucide-react";

function FeaturePill({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2">
      <CheckCircle2 className="h-4 w-4 text-orange-500" />
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300">
        {text}
      </span>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 shadow-lg transition-all hover:border-orange-500/40 hover:bg-zinc-900">
      <div className="mb-4 text-orange-500">{icon}</div>
      <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-white italic">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  highlight,
  features,
  primary = false,
}: {
  title: string;
  price: string;
  highlight?: string;
  features: string[];
  primary?: boolean;
}) {
  return (
    <div
      className={
        primary
          ? "rounded-[34px] bg-orange-600 p-[2px] shadow-2xl"
          : "rounded-[34px] border border-zinc-800 bg-zinc-950"
      }
    >
      <div className="relative h-full rounded-[32px] bg-zinc-950 p-8">
        {highlight && (
          <div className="absolute right-0 top-0 rounded-bl-3xl bg-orange-500 px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white italic">
            {highlight}
          </div>
        )}

        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">
          {title}
        </h3>

        <div className="mt-5 mb-8">
          <div className="text-5xl font-black italic text-white">{price}</div>
        </div>

        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-zinc-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/app");
    }
  }, [status, router]);

  const irParaCadastro = () => router.push("/cadastro");
  const irParaLogin = () => router.push("/login");

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-white">
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2"
          >
            <BrainCircuit className="h-7 w-7 text-orange-500" />
            <span className="text-2xl font-black uppercase tracking-tighter text-white italic">
              Pappi<span className="text-orange-500">Gestor</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={irParaLogin}
              className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-white"
            >
              Entrar
            </button>

            <button
              onClick={irParaCadastro}
              className="rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-orange-500"
            >
              Criar conta
            </button>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pt-40 pb-24">
        <div className="pointer-events-none absolute left-1/2 top-16 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-600/10 blur-[140px]" />

        <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300 italic">
                gestão inteligente para operação real
              </span>
            </div>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-tighter text-white italic md:text-7xl">
              Controle compras, estoque e financeiro em um só lugar.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-400">
              O Pappi Gestor organiza a rotina da empresa com leitura de notas,
              acompanhamento de estoque, controle financeiro e apoio de IA para
              reduzir erro, retrabalho e desorganização.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <FeaturePill text="Leitura de notas" />
              <FeaturePill text="Controle de estoque" />
              <FeaturePill text="Compras organizadas" />
              <FeaturePill text="Financeiro integrado" />
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={irParaCadastro}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-black transition-all hover:bg-zinc-200"
              >
                Começar agora
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={irParaLogin}
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:border-zinc-500 hover:bg-zinc-900"
              >
                Já tenho acesso
              </button>
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-[34px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    visão operacional
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white italic">
                    tudo no mesmo painel
                  </h2>
                </div>
                <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-500">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
                      Notas e documentos
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Entrada por foto, PDF, XML, QR Code e link.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
                      Estoque e recebimento
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Atualização de itens, alertas e rastreio por operação.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
                      Compras inteligentes
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Lista, cotação, fornecedor e histórico de preço em um fluxo só.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">
            por que o pappi
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white italic md:text-5xl">
            Menos improviso. Mais controle.
          </h2>
          <p className="mt-4 text-zinc-400">
            O sistema foi pensado para operação, compras, financeiro e gestão
            trabalharem com a mesma base.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ValueCard
            icon={<Receipt size={28} />}
            title="Leitura automática"
            desc="Capture dados de notas e documentos sem depender de digitação manual o tempo todo."
          />
          <ValueCard
            icon={<ShoppingCart size={28} />}
            title="Compras organizadas"
            desc="Centralize pedidos, lista de compras, fornecedores e histórico em um fluxo consistente."
          />
          <ValueCard
            icon={<ShieldCheck size={28} />}
            title="Mais segurança"
            desc="Estruture acessos por empresa, cargo, setor e permissões para evitar bagunça operacional."
          />
          <ValueCard
            icon={<Boxes size={28} />}
            title="Operação previsível"
            desc="Acompanhe entradas, estoque mínimo e necessidades antes de virar problema no dia a dia."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">
            planos
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white italic md:text-5xl">
            Escolha o ritmo da sua operação
          </h2>
        </div>

        <div className="grid items-stretch gap-8 md:grid-cols-3">
          <PlanCard
            title="Pappi Start"
            price="Grátis"
            features={[
              "Cadastro básico de produtos",
              "Controle inicial de estoque",
              "Organização simples da operação",
            ]}
          />

          <PlanCard
            title="Pappi Gestor"
            price="R$ 49/mês"
            features={[
              "Financeiro e operação integrados",
              "Controle em tempo real",
              "Rotina mais organizada",
            ]}
          />

          <PlanCard
            title="Pappi Pro IA"
            price="R$ 99/mês"
            highlight="melhor opção"
            primary
            features={[
              "Assessor IA de compras",
              "Leitura inteligente de documentos",
              "Fluxos automáticos com mais velocidade",
            ]}
          />
        </div>
      </section>

      <footer className="mt-16 border-t border-zinc-900 py-10 text-center">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-600 italic">
          Pappi Gestor • Sistema de gestão operacional
        </p>
      </footer>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Copy, CheckCircle2, Coins, Users, Sparkles } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  creditBalanceCents: number;
  creditEarnedCents: number;
  referredCompanies: Array<{ id: string; name: string; created_at: string }>;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

export default function IndicacoesPage() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/referrals/summary", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar indicações");
        setSummary(data);
      } catch (err: any) {
        setError(err?.message || "Falha ao carregar indicações");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = useMemo(
    () => [
      {
        title: "Saldo para abater",
        value: formatMoney(summary?.creditBalanceCents || 0),
        icon: <Coins className="h-5 w-5" />,
      },
      {
        title: "Crédito total gerado",
        value: formatMoney(summary?.creditEarnedCents || 0),
        icon: <Gift className="h-5 w-5" />,
      },
      {
        title: "Empresas indicadas",
        value: String(summary?.referredCompanies?.length || 0),
        icon: <Users className="h-5 w-5" />,
      },
    ],
    [summary],
  );

  async function copyLink() {
    if (!summary?.referralLink) return;
    await navigator.clipboard.writeText(summary.referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-[32px] bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/80">indicações</p>
            <h1 className="mt-2 text-3xl font-black italic tracking-tight">Crédito por empresa indicada</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90">
              Cada nova empresa indicada pode gerar crédito para abater sua assinatura. O link abaixo já sai pronto para compartilhar.
            </p>
          </div>
          <div className="rounded-3xl bg-white/15 p-4 backdrop-blur-xl">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-orange-100 bg-white p-8 text-sm font-semibold text-gray-500">
          Carregando programa de indicação...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-500">{card.title}</p>
                  <div className="rounded-2xl bg-orange-50 p-2 text-orange-600">{card.icon}</div>
                </div>
                <p className="mt-4 text-3xl font-black tracking-tight text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">seu link</p>
            <div className="mt-3 rounded-2xl bg-orange-50 p-4">
              <p className="text-sm font-semibold break-all text-gray-700">{summary?.referralLink}</p>
              <p className="mt-2 text-xs text-gray-500">Código: {summary?.referralCode}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={copyLink} className="rounded-2xl bg-orange-600 text-white hover:bg-orange-700">
                {copied ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Link copiado" : "Copiar link"}
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-50 p-2 text-orange-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">Empresas indicadas</h2>
                <p className="text-sm text-gray-500">Histórico das empresas que entraram usando o seu código.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {summary?.referredCompanies?.length ? (
                summary.referredCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
                    <div>
                      <p className="font-bold text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">
                        Entrou em {new Date(company.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      + {formatMoney(5000)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                  Nenhuma empresa entrou pelo seu código ainda.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

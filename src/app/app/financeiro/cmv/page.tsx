"use client";

import { useEffect, useState } from "react";
import { Pizza, DollarSign, TrendingUp } from "lucide-react";

interface CMVData {
  faturamento: number;
  custoTotal: number;
  lucro: number;
  cmv: number;
}

interface CardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}

export default function CMVPage() {
  const [data, setData] = useState<CMVData | null>(null);

  async function load() {
    try {
      const empresaId = localStorage.getItem("empresa_id");

      const res = await fetch("/api/financeiro/cmv", {
        headers: {
          "x-empresa-id": empresaId || "",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar CMV");
      }

      const json = (await res.json()) as CMVData;
      setData(json);
    } catch (error) {
      console.error("Erro ao carregar CMV:", error);
      setData({
        faturamento: 0,
        custoTotal: 0,
        lucro: 0,
        cmv: 0,
      });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (!data) return <div>Carregando...</div>;

  function Card({ title, value, icon }: CardProps) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">{title}</span>
          {icon}
        </div>

        <div className="text-2xl font-bold">
          {typeof value === "number"
            ? value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : value}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        CMV — Custo da Mercadoria Vendida
      </h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Faturamento"
          value={data.faturamento}
          icon={<DollarSign />}
        />

        <Card
          title="Custo"
          value={data.custoTotal}
          icon={<Pizza />}
        />

        <Card
          title="Lucro"
          value={data.lucro}
          icon={<TrendingUp />}
        />

        <Card
          title="CMV"
          value={`${data.cmv.toFixed(2)} %`}
          icon={<Pizza />}
        />
      </div>
    </div>
  );
}
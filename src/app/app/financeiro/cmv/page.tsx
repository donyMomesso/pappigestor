"use client";

import { useEffect, useState } from "react";
import { Pizza, DollarSign, TrendingUp } from "lucide-react";

export default function CMVPage() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const empresaId = localStorage.getItem("empresa_id");

    const res = await fetch("/api/financeiro/cmv", {
      headers: {
        "x-empresa-id": empresaId || "",
      },
    });

    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) return <div>Carregando...</div>;

  function Card({ title, value, icon }: any) {
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
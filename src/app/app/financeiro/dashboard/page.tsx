"use client";

import { useEffect, useState } from "react";
import { DollarSign, AlertTriangle, Calendar, CheckCircle } from "lucide-react";

interface DashboardData {
  pagarHoje: number;
  pagarAtrasado: number;
  totalPendente: number;
  totalPago: number;
}

interface CardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

export default function FinanceiroDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    try {
      const empresaId = localStorage.getItem("empresa_id");

      const res = await fetch("/api/financeiro/dashboard", {
        headers: {
          "x-empresa-id": empresaId || "",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar dashboard financeiro");
      }

      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (error) {
      console.error("Erro ao carregar dashboard financeiro:", error);
      setData({
        pagarHoje: 0,
        pagarAtrasado: 0,
        totalPendente: 0,
        totalPago: 0,
      });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (!data) {
    return <div>Carregando...</div>;
  }

  function Card({ title, value, icon }: CardProps) {
    return (
      <div className="bg-white p-5 rounded-xl shadow border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">{title}</span>
          {icon}
        </div>

        <div className="text-2xl font-bold">
          R$ {value.toLocaleString("pt-BR")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Dashboard Financeiro
      </h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Pagar Hoje"
          value={data.pagarHoje}
          icon={<Calendar />}
        />

        <Card
          title="Atrasado"
          value={data.pagarAtrasado}
          icon={<AlertTriangle />}
        />

        <Card
          title="Total Pendente"
          value={data.totalPendente}
          icon={<DollarSign />}
        />

        <Card
          title="Total Pago"
          value={data.totalPago}
          icon={<CheckCircle />}
        />
      </div>
    </div>
  );
}

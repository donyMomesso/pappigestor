import { StatsCards } from "@/components/dashboard/stats-cards";
import { InventoryAlerts } from "@/components/ia/inventory-alerts";
import { ABCChart } from "@/components/dashboard/abc-chart";

export default function DashboardPage() {
  return (
    <>
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Painel Operacional</h1>
          <p className="text-muted-foreground text-orange-600 font-medium">
            Pappi Gestor — Inteligência em tempo real.
          </p>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de Curva ABC - Prioridade Regra 11 */}
        <div className="col-span-4 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Análise de Insumos (Curva ABC)</h3>
          <ABCChart />
        </div>

        {/* Alertas da IA - Assessor IA */}
        <div className="col-span-3 space-y-4">
          <InventoryAlerts />
        </div>
      </div>
    </>
  );
}

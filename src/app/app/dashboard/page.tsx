import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { InventoryAlerts } from "@/components/ia/inventory-alerts";
import { ABCChart } from "@/components/dashboard/abc-chart";

export default async function DashboardPage() {
  const session = await getServerSession();

  // Proteção de rota: se não estiver logado, redireciona para login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Painel Operacional
          </h1>
          <p className="font-medium text-orange-600">
            Pappi Gestor — Inteligência em tempo real.
          </p>
        </div>

        {/* Exibe dados do usuário logado */}
        <div className="flex items-center gap-3">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name ?? "Usuário"}
              className="h-10 w-10 rounded-full border"
            />
          )}
          <div>
            <p className="text-sm font-semibold">{session.user?.name}</p>
            <p className="text-xs text-muted-foreground">{session.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Análise de Insumos (Curva ABC)</h3>
          <ABCChart />
        </div>

        <div className="col-span-3 space-y-4">
          <InventoryAlerts />
        </div>
      </div>
    </div>
  );
}
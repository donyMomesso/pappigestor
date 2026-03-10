import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const stats = [
  { label: "Custo Insumos", value: "R$ 12.450", trend: "+2.5%", trendUp: false, color: "text-red-500" },
  { label: "Estoque Crítico", value: "8 itens", trend: "Alerta", trendUp: false, color: "text-orange-500" },
  { label: "Sugestão Compra", value: "R$ 4.200", trend: "IA", trendUp: true, color: "text-blue-500" },
  { label: "Margem Média", value: "68%", trend: "+1.2%", trendUp: true, color: "text-green-500" },
]

export function StatsCards() {
  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white p-5 rounded-xl border shadow-sm group hover:border-orange-500 transition-all">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
            <div className={`flex items-center text-xs font-bold ${stat.color}`}>
              {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stat.trend}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

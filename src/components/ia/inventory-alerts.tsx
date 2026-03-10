import { Sparkles } from "lucide-react"

export function InventoryAlerts() {
  return (
    <div className="bg-zinc-900 text-white p-5 rounded-xl border-l-4 border-orange-500 shadow-lg">
      <div className="flex items-center gap-2 mb-3 text-orange-400">
        <Sparkles size={18} />
        <span className="text-xs font-bold uppercase tracking-wider">Assessor IA</span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">
        "O preço da **Farinha 00** subiu 12% no fornecedor principal. Recomendo verificar o ranking de fornecedores para otimizar o custo hoje."
      </p>
    </div>
  )
}

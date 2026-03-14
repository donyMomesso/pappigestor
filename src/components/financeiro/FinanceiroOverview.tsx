"use client";

export default function FinanceiroOverview() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</div>
        <div className="mt-2 text-lg font-semibold text-zinc-900">Financeiro premium ativo</div>
        <p className="mt-1 text-sm text-zinc-600">A central nova está sobre o módulo legado para não quebrar as páginas atuais.</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Próximo passo</div>
        <div className="mt-2 text-lg font-semibold text-zinc-900">Conciliação</div>
        <p className="mt-1 text-sm text-zinc-600">Vincular nota, boleto e lançamento com regras e IA.</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Modo seguro</div>
        <div className="mt-2 text-lg font-semibold text-zinc-900">Compatível</div>
        <p className="mt-1 text-sm text-zinc-600">Sem substituir a tela financeira antiga nem alterar suas rotas existentes.</p>
      </div>
    </div>
  );
}

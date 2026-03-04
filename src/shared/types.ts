// src/shared/types.ts

export type CategoriaLancamento =
  | "vendas"
  | "compras"
  | "salarios"
  | "impostos"
  | "aluguel"
  | "marketing"
  | "taxas"
  | "outros";

export type StatusLancamento = "pago" | "pendente" | "atrasado";

export interface Lancamento {
  id?: string;
  empresa_id?: string;

  tipo: "entrada" | "saida";
  categoria: CategoriaLancamento;
  descricao: string;

  // ✅ O Financeiro.tsx usa esses 2:
  valor_previsto: number;
  valor_real?: number | null;

  vencimento_previsto: string; // YYYY-MM-DD
  vencimento_real?: string | null;

  status?: StatusLancamento;

  forma_pagamento?:
    | "pix"
    | "dinheiro"
    | "cartao"
    | "boleto"
    | "transferencia"
    | string;

  observacoes?: string | null;
  criado_em?: string;
  atualizado_em?: string;

  // compat com telas antigas (se existirem)
  data?: string;
  valor?: number;
  vencimento?: string;
}

export const CATEGORIAS: Array<{ value: CategoriaLancamento; label: string }> = [
  { value: "vendas", label: "Vendas" },
  { value: "compras", label: "Compras" },
  { value: "salarios", label: "Salários" },
  { value: "impostos", label: "Impostos" },
  { value: "aluguel", label: "Aluguel" },
  { value: "marketing", label: "Marketing" },
  { value: "taxas", label: "Taxas" },
  { value: "outros", label: "Outros" },
];

function parseISODate(d?: string | null): Date | null {
  if (!d) return null;
  const s = d.trim();
  const dt = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function calcularStatus(l: Partial<Lancamento>): StatusLancamento {
  if (l.status === "pago") return "pago";
  if (l.vencimento_real || (typeof l.valor_real === "number" && l.valor_real > 0)) return "pago";

  const hoje = new Date();
  const hojeZerado = new Date(hoje.toDateString());

  const venc =
    parseISODate(l.vencimento_previsto) ||
    parseISODate(l.vencimento) ||
    parseISODate(l.data);

  if (venc && venc < hojeZerado) return "atrasado";
  return "pendente";
}
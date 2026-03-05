// src/shared/types.ts

// ============================================================================
// ITENS DE LANÇAMENTO (usado em compras / recebimento)
// ============================================================================

export type ItemLancamento = {
  id?: number | string;

  produto: string;

  // formato antigo
  qtd?: number;
  preco_un?: number;

  // formato novo usado no recebimento
  quantidade_pedida?: number;
  quantidade_recebida?: number;

  valor_unitario?: number;

  total?: number;
  unidade?: string;
};

// ============================================================================
// CATEGORIAS
// ============================================================================

export type CategoriaLancamento =
  | "vendas"
  | "compras"
  | "salarios"
  | "impostos"
  | "aluguel"
  | "marketing"
  | "taxas"
  | "outros";

// ============================================================================
// STATUS
// ============================================================================

export type StatusLancamento = "pago" | "pendente" | "atrasado";

// ============================================================================
// LANÇAMENTO BASE (Financeiro)
// ============================================================================

export interface Lancamento {
  id?: string;
  empresa_id?: string;

  tipo: "entrada" | "saida";
  categoria: CategoriaLancamento;

  descricao: string;

  // valores
  valor_previsto: number;
  valor_real?: number | null;

  // datas
  vencimento_previsto: string;
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

  // compatibilidade telas antigas
  data?: string;
  valor?: number;
  vencimento?: string;
}

// ============================================================================
// LANÇAMENTO COM ITENS (usado no RECEBIMENTO)
// ============================================================================

export interface LancamentoComItens extends Lancamento {
  fornecedor?: string;

  data_pedido?: string | null;
  data_pagamento?: string | null;

  itens: ItemLancamento[];
}

// ============================================================================
// CATEGORIAS UI
// ============================================================================

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

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function parseISODate(d?: string | null): Date | null {
  if (!d) return null;

  const s = d.trim();

  const dt = new Date(
    s.length === 10
      ? `${s}T00:00:00`
      : s
  );

  return Number.isNaN(dt.getTime())
    ? null
    : dt;
}

// ============================================================================
// CALCULAR STATUS AUTOMÁTICO
// ============================================================================

export function calcularStatus(
  l: Partial<Lancamento>
): StatusLancamento {

  if (l.status === "pago") return "pago";

  if (
    l.vencimento_real ||
    (typeof l.valor_real === "number" && l.valor_real > 0)
  ) {
    return "pago";
  }

  const hoje = new Date();
  const hojeZerado = new Date(hoje.toDateString());

  const venc =
    parseISODate(l.vencimento_previsto) ||
    parseISODate(l.vencimento) ||
    parseISODate(l.data);

  if (venc && venc < hojeZerado) {
    return "atrasado";
  }

  return "pendente";
}
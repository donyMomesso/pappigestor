// Simple in-memory DB for local development.
// Data resets when the server restarts.

export type Produto = {
  id: string;
  nome_produto: string;
  categoria_produto: string;
  unidade_medida: string;
  ultimo_preco_pago: number | null;
  fornecedor_preferencial_id?: string | null;
};

export type Fornecedor = {
  id: string;
  nome_fantasia: string;
  telefone_whatsapp: string;
  categoria_principal: string;
  mensagem_padrao_cotacao?: string;
};

export type ItemLista = {
  id: string;
  produto_id: string;
  quantidade_solicitada: number;
  status_solicitacao: "pendente" | "em_cotacao" | "aprovado" | "cancelado";
  data_solicitacao: string;
  usuario_solicitante_id: string;
};

export type Estoque = {
  id: string;
  produto_id: string;
  quantidade_atual: number;
  estoque_minimo: number;
};

type DB = {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  itens: ItemLista[];
  estoque: Estoque[];
};

declare global {
  // eslint-disable-next-line no-var
  var __PAPPI_DB__: Record<string, DB> | undefined;
}

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function getPizzariaId(headers: Headers) {
  const pId = headers.get("x-empresa-id") || "";
  if (!pId) throw new Error("Missing x-empresa-id");
  return pId;
}

export function getDb(empresaId: string): DB {
  if (!globalThis.__PAPPI_DB__) globalThis.__PAPPI_DB__ = {};
  if (!globalThis.__PAPPI_DB__![empresaId]) {
    globalThis.__PAPPI_DB__![empresaId] = seed();
  }
  return globalThis.__PAPPI_DB__![empresaId];
}

export function createProduto(db: DB, data: Omit<Produto, "id" | "ultimo_preco_pago"> & { ultimo_preco_pago?: number | null }) {
  const p: Produto = {
    id: uuid(),
    nome_produto: data.nome_produto,
    categoria_produto: data.categoria_produto,
    unidade_medida: data.unidade_medida,
    ultimo_preco_pago: data.ultimo_preco_pago ?? null,
    fornecedor_preferencial_id: data.fornecedor_preferencial_id ?? null,
  };
  db.produtos.unshift(p);
  db.estoque.push({ id: uuid(), produto_id: p.id, quantidade_atual: 0, estoque_minimo: 1 });
  return p;
}

export function createItem(db: DB, produtoId: string, quantidade: number) {
  const item: ItemLista = {
    id: uuid(),
    produto_id: produtoId,
    quantidade_solicitada: quantidade,
    status_solicitacao: "pendente",
    data_solicitacao: new Date().toISOString(),
    usuario_solicitante_id: "local",
  };
  db.itens.unshift(item);
  return item;
}

export function seed(): DB {
  const fornecedores: Fornecedor[] = [
    {
      id: "forn-1",
      nome_fantasia: "Distribuidora Campinas",
      telefone_whatsapp: "(19) 99999-9999",
      categoria_principal: "Insumos",
      mensagem_padrao_cotacao: "Olá! Preciso de cotação dos itens abaixo:",
    },
  ];

  const produtos: Produto[] = [
    {
      id: "prod-1",
      nome_produto: "Mussarela",
      categoria_produto: "Laticínios e Frios",
      unidade_medida: "kg",
      ultimo_preco_pago: 0,
      fornecedor_preferencial_id: "forn-1",
    },
    {
      id: "prod-2",
      nome_produto: "Calabresa",
      categoria_produto: "Embutidos e Suínos",
      unidade_medida: "kg",
      ultimo_preco_pago: 0,
      fornecedor_preferencial_id: "forn-1",
    },
    {
      id: "prod-3",
      nome_produto: "Farinha de Trigo",
      categoria_produto: "Mercearia e Condimentos",
      unidade_medida: "sc",
      ultimo_preco_pago: 0,
      fornecedor_preferencial_id: "forn-1",
    },
  ];

  const estoque: Estoque[] = [
    { id: "est-1", produto_id: "prod-1", quantidade_atual: 2, estoque_minimo: 5 },
    { id: "est-2", produto_id: "prod-2", quantidade_atual: 1, estoque_minimo: 4 },
    { id: "est-3", produto_id: "prod-3", quantidade_atual: 0, estoque_minimo: 1 },
  ];

  const itens: ItemLista[] = [
    {
      id: "item-1",
      produto_id: "prod-1",
      quantidade_solicitada: 5,
      status_solicitacao: "pendente",
      data_solicitacao: new Date().toISOString(),
      usuario_solicitante_id: "local",
    },
  ];

  return { produtos, fornecedores, itens, estoque };
}
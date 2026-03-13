// Simple in-memory DB for local development.
// Data resets when the server restarts.

export type Produto = {
  id: string;
  nome_produto: string;
  categoria_produto: string;
  unidade_medida: string;
  ultimo_preco_pago: number | null;
  fornecedor_preferencial_id?: string | null;
  codigo_barras?: string | null;
  marca?: string | null;
  descricao?: string | null;
  peso_embalagem?: string | null;
  preco_referencia?: number | null;
  catalogo_base_id?: string | null;
  created_at: string;
};

export type Fornecedor = {
  id: string;
  nome_fantasia: string;
  telefone_whatsapp: string;
  categoria_principal: string;
  mensagem_padrao_cotacao?: string;
  is_ativo?: number;
};

export type ItemLista = {
  id: string;
  produto_id: string;
  quantidade_solicitada: number;
  status_solicitacao: "pendente" | "em_cotacao" | "aprovado" | "cancelado";
  data_solicitacao: string;
  usuario_solicitante_id: string;
  observacao?: string;
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
  const pId = headers.get("x-pizzaria-id") || headers.get("x-empresa-id") || "";
  if (!pId) throw new Error("Missing x-pizzaria-id");
  return pId;
}

export function getDb(pizzariaId: string): DB {
  if (!globalThis.__PAPPI_DB__) globalThis.__PAPPI_DB__ = {};
  if (!globalThis.__PAPPI_DB__![pizzariaId]) {
    globalThis.__PAPPI_DB__![pizzariaId] = seed();
  }
  return globalThis.__PAPPI_DB__![pizzariaId];
}

export function createProduto(
  db: DB,
  data: Omit<Produto, "id" | "ultimo_preco_pago" | "created_at"> & { ultimo_preco_pago?: number | null }
) {
  const p: Produto = {
    id: uuid(),
    nome_produto: data.nome_produto,
    categoria_produto: data.categoria_produto,
    unidade_medida: data.unidade_medida,
    ultimo_preco_pago: data.ultimo_preco_pago ?? null,
    fornecedor_preferencial_id: data.fornecedor_preferencial_id ?? null,
    codigo_barras: data.codigo_barras ?? null,
    marca: data.marca ?? null,
    descricao: data.descricao ?? null,
    peso_embalagem: data.peso_embalagem ?? null,
    preco_referencia: data.preco_referencia ?? null,
    catalogo_base_id: data.catalogo_base_id ?? null,
    created_at: new Date().toISOString(),
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
      is_ativo: 1,
    },
  ];

  const produtos: Produto[] = [
    {
      id: "prod-1",
      nome_produto: "Muçarela",
      categoria_produto: "Laticínios",
      unidade_medida: "kg",
      ultimo_preco_pago: 39.9,
      fornecedor_preferencial_id: "forn-1",
      descricao: "Queijo base para pizzas e lanches",
      peso_embalagem: "peça",
      catalogo_base_id: "l-1",
      created_at: new Date().toISOString(),
    },
    {
      id: "prod-2",
      nome_produto: "Linguiça calabresa",
      categoria_produto: "Frios e Embutidos",
      unidade_medida: "kg",
      ultimo_preco_pago: 24.9,
      fornecedor_preferencial_id: "forn-1",
      descricao: "Calabresa para cobertura e recheio",
      peso_embalagem: "pacote",
      catalogo_base_id: "f-1",
      created_at: new Date().toISOString(),
    },
    {
      id: "prod-3",
      nome_produto: "Farinha de trigo",
      categoria_produto: "Mercearia",
      unidade_medida: "kg",
      ultimo_preco_pago: 4.5,
      fornecedor_preferencial_id: "forn-1",
      descricao: "Farinha base para massas",
      peso_embalagem: "saco",
      catalogo_base_id: "m-1",
      created_at: new Date().toISOString(),
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
      observacao: "Gerado pelo estoque mínimo",
    },
  ];

  return { produtos, fornecedores, itens, estoque };
}

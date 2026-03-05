export interface ProdutoEstoque {
  id: string
  nome: string
  estoque_atual: number
  estoque_minimo: number
  estoque_alvo: number
  unidade_compra: string
}

export interface NecessidadeCompra {
  produto_id: string
  produto: string
  quantidade: number
  unidade: string
}

export function calcularNecessidades(produtos: ProdutoEstoque[]): NecessidadeCompra[] {
  const necessidades: NecessidadeCompra[] = []

  for (const p of produtos) {
    if (p.estoque_atual <= p.estoque_minimo) {
      const qtd = Math.ceil(p.estoque_alvo - p.estoque_atual)

      if (qtd > 0) {
        necessidades.push({
          produto_id: p.id,
          produto: p.nome,
          quantidade: qtd,
          unidade: p.unidade_compra
        })
      }
    }
  }

  return necessidades
}
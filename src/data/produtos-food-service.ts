export interface ProdutoFoodService {
  id: string;
  nome: string;
  categoria: string;
  subcategoria?: string;
  unidadeMedida?: string;
  embalagem?: string;
  descricao?: string;
  ncm?: string;
  sinonimos?: string[];
}

export const CATEGORIAS_FOOD_SERVICE = [
  "Laticínios",
  "Frios e Embutidos",
  "Carnes e Aves",
  "Pescados",
  "Hortifruti",
  "Grãos e Cereais",
  "Farinhas e Misturas",
  "Massas",
  "Molhos e Condimentos",
  "Padaria e Confeitaria",
  "Congelados",
  "Bebidas",
  "Descartáveis e Embalagens",
  "Limpeza",
  "Mercearia",
  "Temperos e Especiarias",
  "Óleos e Gorduras",
  "Doces e Sobremesas",
  "Enlatados e Conservas",
  "Insumos Operacionais",
] as const;

export const PRODUTOS_FOOD_SERVICE: ProdutoFoodService[] = [
  {
    id: "laticinios-mucarela",
    nome: "Muçarela",
    categoria: "Laticínios",
    subcategoria: "Queijos",
    unidadeMedida: "kg",
    embalagem: "peça",
    descricao: "Queijo muçarela para preparo, cobertura e recheio",
    sinonimos: ["mussarela", "mucarela", "queijo muçarela", "mussa"],
  },
  {
    id: "laticinios-prato",
    nome: "Queijo prato",
    categoria: "Laticínios",
    subcategoria: "Queijos",
    unidadeMedida: "kg",
    embalagem: "peça",
    descricao: "Queijo prato para lanches e preparo",
    sinonimos: ["prato", "queijo prato"],
  },
  {
    id: "laticinios-parmesao",
    nome: "Queijo parmesão",
    categoria: "Laticínios",
    subcategoria: "Queijos",
    unidadeMedida: "kg",
    embalagem: "peça",
    descricao: "Queijo parmesão para finalização e preparo",
    sinonimos: ["parmesao", "queijo ralado parmesão"],
  },
  {
    id: "laticinios-requeijao",
    nome: "Requeijão",
    categoria: "Laticínios",
    subcategoria: "Cremes e pastas",
    unidadeMedida: "kg",
    embalagem: "balde",
    descricao: "Requeijão culinário para recheios e coberturas",
    sinonimos: ["requeijao", "requeijão culinário"],
  },
  {
    id: "laticinios-creme-leite",
    nome: "Creme de leite",
    categoria: "Laticínios",
    subcategoria: "Cremes",
    unidadeMedida: "l",
    embalagem: "caixa",
    descricao: "Creme de leite para molhos, recheios e sobremesas",
    sinonimos: ["creme de leite uht", "nata culinária"],
  },
  {
    id: "laticinios-leite-integral",
    nome: "Leite integral",
    categoria: "Laticínios",
    subcategoria: "Leites",
    unidadeMedida: "l",
    embalagem: "caixa",
    descricao: "Leite integral para bebidas, preparo e confeitaria",
    sinonimos: ["leite", "leite uht"],
  },
  {
    id: "laticinios-manteiga",
    nome: "Manteiga",
    categoria: "Laticínios",
    subcategoria: "Gorduras lácteas",
    unidadeMedida: "kg",
    embalagem: "pote",
    descricao: "Manteiga para preparo culinário e finalização",
    sinonimos: ["manteiga com sal", "manteiga sem sal"],
  },
  {
    id: "laticinios-margarina",
    nome: "Margarina",
    categoria: "Laticínios",
    subcategoria: "Gorduras",
    unidadeMedida: "kg",
    embalagem: "balde",
    descricao: "Margarina para chapa, panificação e confeitaria",
    sinonimos: ["margarina culinária"],
  },
  {
    id: "frios-presunto",
    nome: "Presunto",
    categoria: "Frios e Embutidos",
    subcategoria: "Frios fatiáveis",
    unidadeMedida: "kg",
    embalagem: "peça",
    descricao: "Presunto para lanches, pizzas e recheios",
    sinonimos: ["presunto cozido"],
  },
  {
    id: "frios-peito-peru",
    nome: "Peito de peru",
    categoria: "Frios e Embutidos",
    subcategoria: "Frios fatiáveis",
    unidadeMedida: "kg",
    embalagem: "peça",
    descricao: "Peito de peru para lanches e recheios",
    sinonimos: ["peito peru"],
  },
  {
    id: "frios-calabresa",
    nome: "Linguiça calabresa",
    categoria: "Frios e Embutidos",
    subcategoria: "Embutidos",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Calabresa para pizzas, lanches e preparo",
    sinonimos: ["calabresa", "linguiça defumada"],
  },
  {
    id: "frios-bacon",
    nome: "Bacon",
    categoria: "Frios e Embutidos",
    subcategoria: "Defumados",
    unidadeMedida: "kg",
    embalagem: "peça",
    descricao: "Bacon para recheios, molhos e finalização",
    sinonimos: ["bacon fatiado", "bacon peça"],
  },
  {
    id: "frios-salsicha",
    nome: "Salsicha",
    categoria: "Frios e Embutidos",
    subcategoria: "Embutidos cozidos",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Salsicha para lanches, cachorro-quente e preparo",
    sinonimos: ["salsicha hot dog"],
  },
  {
    id: "carnes-frango-file",
    nome: "Filé de frango",
    categoria: "Carnes e Aves",
    subcategoria: "Frango",
    unidadeMedida: "kg",
    embalagem: "bandeja",
    descricao: "Filé de frango para grelha, recheios e porções",
    sinonimos: ["peito de frango", "frango filé"],
  },
  {
    id: "carnes-frango-desfiado",
    nome: "Frango desfiado",
    categoria: "Carnes e Aves",
    subcategoria: "Frango processado",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Frango desfiado para recheios e preparações",
    sinonimos: ["frango cozido desfiado"],
  },
  {
    id: "carnes-carne-moida",
    nome: "Carne moída",
    categoria: "Carnes e Aves",
    subcategoria: "Bovina",
    unidadeMedida: "kg",
    embalagem: "bandeja",
    descricao: "Carne bovina moída para molhos e recheios",
    sinonimos: ["carne bovina moída"],
  },
  {
    id: "carnes-hamburguer",
    nome: "Hambúrguer bovino",
    categoria: "Carnes e Aves",
    subcategoria: "Processados",
    unidadeMedida: "un",
    embalagem: "caixa",
    descricao: "Hambúrguer bovino para lanches",
    sinonimos: ["burger bovino", "hamburguer"],
  },
  {
    id: "pescados-atum",
    nome: "Atum",
    categoria: "Pescados",
    subcategoria: "Conservas e pescados",
    unidadeMedida: "kg",
    embalagem: "lata",
    descricao: "Atum para recheios, saladas e pizzas",
    sinonimos: ["atum sólido", "atum ralado"],
  },
  {
    id: "hortifruti-tomate",
    nome: "Tomate",
    categoria: "Hortifruti",
    subcategoria: "Legumes",
    unidadeMedida: "kg",
    embalagem: "caixa",
    descricao: "Tomate para saladas, molhos e preparo",
    sinonimos: ["tomate comum"],
  },
  {
    id: "hortifruti-cebola",
    nome: "Cebola",
    categoria: "Hortifruti",
    subcategoria: "Legumes",
    unidadeMedida: "kg",
    embalagem: "saco",
    descricao: "Cebola para base de preparo e finalização",
    sinonimos: ["cebola branca"],
  },
  {
    id: "hortifruti-alho",
    nome: "Alho",
    categoria: "Hortifruti",
    subcategoria: "Temperos frescos",
    unidadeMedida: "kg",
    embalagem: "caixa",
    descricao: "Alho in natura para tempero e preparo",
    sinonimos: ["alho cabeça"],
  },
  {
    id: "hortifruti-batata",
    nome: "Batata",
    categoria: "Hortifruti",
    subcategoria: "Tubérculos",
    unidadeMedida: "kg",
    embalagem: "saco",
    descricao: "Batata para fritura, cozimento e preparo",
    sinonimos: ["batata inglesa"],
  },
  {
    id: "graos-arroz",
    nome: "Arroz",
    categoria: "Grãos e Cereais",
    subcategoria: "Cereais",
    unidadeMedida: "kg",
    embalagem: "saco",
    descricao: "Arroz para preparo culinário",
    sinonimos: ["arroz branco"],
  },
  {
    id: "graos-feijao",
    nome: "Feijão",
    categoria: "Grãos e Cereais",
    subcategoria: "Leguminosas",
    unidadeMedida: "kg",
    embalagem: "saco",
    descricao: "Feijão para preparo culinário",
    sinonimos: ["feijão carioca", "feijão preto"],
  },
  {
    id: "farinhas-trigo",
    nome: "Farinha de trigo",
    categoria: "Farinhas e Misturas",
    subcategoria: "Farinhas",
    unidadeMedida: "kg",
    embalagem: "saco",
    descricao: "Farinha para massas, panificação e confeitaria",
    sinonimos: ["trigo", "farinha trigo"],
  },
  {
    id: "farinhas-fuba",
    nome: "Fubá",
    categoria: "Farinhas e Misturas",
    subcategoria: "Farinhas",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Fubá para preparo culinário e confeitaria",
    sinonimos: ["fuba"],
  },
  {
    id: "farinhas-amido-milho",
    nome: "Amido de milho",
    categoria: "Farinhas e Misturas",
    subcategoria: "Amidos",
    unidadeMedida: "kg",
    embalagem: "caixa",
    descricao: "Amido para engrossar preparos e confeitaria",
    sinonimos: ["maisena", "amido"],
  },
  {
    id: "massas-macarrao",
    nome: "Macarrão",
    categoria: "Massas",
    subcategoria: "Massas secas",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Massa seca para preparo culinário",
    sinonimos: ["espaguete", "parafuso", "penne"],
  },
  {
    id: "massas-disco-pizza",
    nome: "Disco de pizza",
    categoria: "Massas",
    subcategoria: "Massas prontas",
    unidadeMedida: "un",
    embalagem: "pacote",
    descricao: "Base de pizza para montagem",
    sinonimos: ["massa de pizza", "disco pizza"],
  },
  {
    id: "molhos-tomate",
    nome: "Molho de tomate",
    categoria: "Molhos e Condimentos",
    subcategoria: "Molhos",
    unidadeMedida: "kg",
    embalagem: "sachê",
    descricao: "Molho de tomate para pizzas, massas e preparo",
    sinonimos: ["extrato de tomate", "polpa de tomate"],
  },
  {
    id: "molhos-ketchup",
    nome: "Ketchup",
    categoria: "Molhos e Condimentos",
    subcategoria: "Molhos frios",
    unidadeMedida: "kg",
    embalagem: "bisnaga",
    descricao: "Molho para lanches e porções",
    sinonimos: ["catchup"],
  },
  {
    id: "molhos-mostarda",
    nome: "Mostarda",
    categoria: "Molhos e Condimentos",
    subcategoria: "Molhos frios",
    unidadeMedida: "kg",
    embalagem: "bisnaga",
    descricao: "Molho para lanches e preparo",
    sinonimos: ["mostarda amarela"],
  },
  {
    id: "molhos-maionese",
    nome: "Maionese",
    categoria: "Molhos e Condimentos",
    subcategoria: "Molhos frios",
    unidadeMedida: "kg",
    embalagem: "balde",
    descricao: "Molho para lanches, saladas e preparo",
    sinonimos: ["maionese tradicional"],
  },
  {
    id: "padaria-pao-hamburguer",
    nome: "Pão de hambúrguer",
    categoria: "Padaria e Confeitaria",
    subcategoria: "Pães",
    unidadeMedida: "un",
    embalagem: "pacote",
    descricao: "Pão para montagem de hambúrgueres",
    sinonimos: ["pão hamburger", "bun"],
  },
  {
    id: "padaria-pao-hotdog",
    nome: "Pão de hot dog",
    categoria: "Padaria e Confeitaria",
    subcategoria: "Pães",
    unidadeMedida: "un",
    embalagem: "pacote",
    descricao: "Pão para cachorro-quente",
    sinonimos: ["pão hot dog"],
  },
  {
    id: "congelados-batata-pre-frita",
    nome: "Batata pré-frita congelada",
    categoria: "Congelados",
    subcategoria: "Batatas e acompanhamentos",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Batata congelada para fritura",
    sinonimos: ["batata frita congelada", "batata palito congelada"],
  },
  {
    id: "bebidas-agua-sem-gas",
    nome: "Água sem gás",
    categoria: "Bebidas",
    subcategoria: "Águas",
    unidadeMedida: "un",
    embalagem: "fardo",
    descricao: "Água mineral sem gás",
    sinonimos: ["agua mineral"],
  },
  {
    id: "bebidas-refrigerante-cola",
    nome: "Refrigerante cola",
    categoria: "Bebidas",
    subcategoria: "Refrigerantes",
    unidadeMedida: "un",
    embalagem: "fardo",
    descricao: "Bebida gaseificada sabor cola",
    sinonimos: ["refrigerante cola", "cola", "refri cola"],
  },
  {
    id: "descartaveis-copo",
    nome: "Copo descartável",
    categoria: "Descartáveis e Embalagens",
    subcategoria: "Copos",
    unidadeMedida: "pct",
    embalagem: "pacote",
    descricao: "Copo descartável para bebidas",
    sinonimos: ["copo plastico"],
  },
  {
    id: "descartaveis-marmita",
    nome: "Marmita descartável",
    categoria: "Descartáveis e Embalagens",
    subcategoria: "Marmitas",
    unidadeMedida: "un",
    embalagem: "caixa",
    descricao: "Embalagem para refeição pronta",
    sinonimos: ["marmitex", "embalagem marmita"],
  },
  {
    id: "limpeza-detergente",
    nome: "Detergente",
    categoria: "Limpeza",
    subcategoria: "Lavagem",
    unidadeMedida: "l",
    embalagem: "caixa",
    descricao: "Detergente para limpeza de utensílios",
    sinonimos: ["detergente neutro"],
  },
  {
    id: "mercearia-acucar",
    nome: "Açúcar",
    categoria: "Mercearia",
    subcategoria: "Secos",
    unidadeMedida: "kg",
    embalagem: "saco",
    descricao: "Açúcar para bebidas, confeitaria e preparo",
    sinonimos: ["acucar refinado", "açúcar cristal"],
  },
  {
    id: "mercearia-sal",
    nome: "Sal refinado",
    categoria: "Mercearia",
    subcategoria: "Secos",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Sal para tempero e preparo",
    sinonimos: ["sal", "sal refinado"],
  },
  {
    id: "mercearia-vinagre",
    nome: "Vinagre",
    categoria: "Mercearia",
    subcategoria: "Temperos líquidos",
    unidadeMedida: "l",
    embalagem: "garrafa",
    descricao: "Vinagre para preparo e tempero",
    sinonimos: ["vinagre alcool", "vinagre branco"],
  },
  {
    id: "mercearia-azeitona",
    nome: "Azeitona",
    categoria: "Mercearia",
    subcategoria: "Conservas",
    unidadeMedida: "kg",
    embalagem: "balde",
    descricao: "Azeitona para recheios, pizzas e preparo",
    sinonimos: ["azeitona verde", "azeitona preta"],
  },
  {
    id: "mercearia-ovo",
    nome: "Ovo",
    categoria: "Mercearia",
    subcategoria: "Ovos",
    unidadeMedida: "un",
    embalagem: "caixa",
    descricao: "Ovos para preparo culinário e confeitaria",
    sinonimos: ["ovos", "ovo branco"],
  },
  {
    id: "temperos-oregano",
    nome: "Orégano",
    categoria: "Temperos e Especiarias",
    subcategoria: "Ervas secas",
    unidadeMedida: "kg",
    embalagem: "pacote",
    descricao: "Erva seca para finalização e preparo",
    sinonimos: ["oregano"],
  },
  {
    id: "oleos-oleo-soja",
    nome: "Óleo vegetal",
    categoria: "Óleos e Gorduras",
    subcategoria: "Óleos",
    unidadeMedida: "l",
    embalagem: "garrafa",
    descricao: "Óleo para fritura e preparo culinário",
    sinonimos: ["óleo de soja", "oleo cozinha", "oleo"],
  },
  {
    id: "insumos-gas-glp",
    nome: "Gás GLP",
    categoria: "Insumos Operacionais",
    subcategoria: "Operação",
    unidadeMedida: "un",
    embalagem: "botijão",
    descricao: "Insumo operacional para cocção",
    sinonimos: ["gas", "botijão de gás"],
  },
];

export function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const MAPA_SINONIMOS_PRODUTOS: Record<string, string> = Object.fromEntries(
  PRODUTOS_FOOD_SERVICE.flatMap((produto) => {
    const termos = [produto.nome, ...(produto.sinonimos ?? [])];
    return termos.map((termo) => [normalizarTexto(termo), produto.id]);
  })
);

export function buscarProdutoFoodService(termo: string) {
  const normalizado = normalizarTexto(termo);
  const idEncontrado = MAPA_SINONIMOS_PRODUTOS[normalizado];

  if (idEncontrado) {
    return PRODUTOS_FOOD_SERVICE.find((p) => p.id === idEncontrado) ?? null;
  }

  return (
    PRODUTOS_FOOD_SERVICE.find((produto) => {
      const nome = normalizarTexto(produto.nome);
      const sinonimos = (produto.sinonimos ?? []).map(normalizarTexto);

      return (
        nome.includes(normalizado) ||
        normalizado.includes(nome) ||
        sinonimos.some(
          (s) => s.includes(normalizado) || normalizado.includes(s)
        )
      );
    }) ?? null
  );
}

export function buscarSugestoesFoodService(
  termo: string,
  limite = 8
): ProdutoFoodService[] {
  const normalizado = normalizarTexto(termo);

  if (!normalizado) return [];

  const pontuados = PRODUTOS_FOOD_SERVICE.map((produto) => {
    const nome = normalizarTexto(produto.nome);
    const sinonimos = (produto.sinonimos ?? []).map(normalizarTexto);

    let score = 0;

    if (nome === normalizado) score += 100;
    if (sinonimos.includes(normalizado)) score += 95;

    if (nome.startsWith(normalizado)) score += 70;
    if (sinonimos.some((s) => s.startsWith(normalizado))) score += 65;

    if (nome.includes(normalizado)) score += 40;
    if (sinonimos.some((s) => s.includes(normalizado))) score += 35;

    if (normalizado.includes(nome)) score += 20;
    if (sinonimos.some((s) => normalizado.includes(s))) score += 18;

    return { produto, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.produto.nome.localeCompare(b.produto.nome))
    .slice(0, limite)
    .map((item) => item.produto);

  return pontuados;
}

export function listarProdutosPorCategoria(categoria: string) {
  return PRODUTOS_FOOD_SERVICE.filter((p) => p.categoria === categoria);
}

export interface ItemListaCompraInterpretado {
  texto_original: string;
  produto_padrao: string;
  quantidade: number;
  unidade: string;
  unidade_padrao: string;
  categoria: string;
  embalagem: string;
  catalogo_id: string | null;
  confianca: number;
}

export function sugerirProdutosFoodService(termo: string, limite = 10) {
  return buscarSugestoesFoodService(termo, limite);
}

export interface ItemListaCompraInterpretado {
  texto_original: string;
  produto_padrao: string;
  quantidade: number;
  unidade: string;
  unidade_padrao: string;
  categoria: string;
  embalagem: string;
  catalogo_id: string | null;
  confianca: number;
}

export function unificarListaCompraTexto(texto: string): ItemListaCompraInterpretado[] {
  return String(texto || "")
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => {
      const match = linha.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZÀ-ÿ]+)?\s+(.+)$/);
      const quantidade = match ? Number(match[1].replace(",", ".")) : 1;
      const unidade = (match?.[2] || "UN").toUpperCase();
      const descricao = (match?.[3] || linha).trim();
      const sugestao = buscarProdutoFoodService(descricao);

      return {
        texto_original: linha,
        produto_padrao: sugestao?.nome || descricao,
        quantidade,
        unidade,
        unidade_padrao: unidade,
        categoria: sugestao?.categoria || "Outros",
        embalagem: sugestao?.embalagem || "",
        catalogo_id: sugestao?.id || null,
        confianca: sugestao ? 0.9 : 0.4,
      };
    });
}
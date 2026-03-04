export type ProdutoFoodService = {
  id: string;
  nome: string;
  categoria: string;
};

export const CATEGORIAS_FOOD_SERVICE = [
  "Bebidas",
  "Laticínios",
  "Carnes",
  "Hortifruti",
  "Mercearia",
  "Limpeza",
] as const;

export const PRODUTOS_FOOD_SERVICE: ProdutoFoodService[] = [
  { id: "1", nome: "Muçarela", categoria: "Laticínios" },
  { id: "2", nome: "Molho de Tomate", categoria: "Mercearia" },
  { id: "3", nome: "Refrigerante", categoria: "Bebidas" },
];

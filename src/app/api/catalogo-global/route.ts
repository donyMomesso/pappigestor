import { NextRequest, NextResponse } from "next/server";
import {
  CATEGORIAS_FOOD_SERVICE,
  PRODUTOS_FOOD_SERVICE,
  normalizarTexto,
  sugerirProdutosFoodService,
} from "@/data/produtos-food-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const termo = req.nextUrl.searchParams.get("q") || "";
  const categoria = req.nextUrl.searchParams.get("categoria") || "all";

  let produtos = termo.trim()
    ? sugerirProdutosFoodService(termo, 50)
    : PRODUTOS_FOOD_SERVICE;

  if (categoria !== "all") {
    const categoriaNorm = normalizarTexto(categoria);
    produtos = produtos.filter(
      (produto) => normalizarTexto(produto.categoria) === categoriaNorm
    );
  }

  return NextResponse.json({
    total: produtos.length,
    categorias: CATEGORIAS_FOOD_SERVICE,
    produtos,
  });
}

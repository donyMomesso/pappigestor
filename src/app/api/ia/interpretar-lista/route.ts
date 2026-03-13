import { NextResponse } from "next/server";
import { unificarListaCompraTexto } from "@/data/produtos-food-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const texto = String(body?.texto || "");
    const itens = unificarListaCompraTexto(texto).map((item) => ({
      produto: item.produto_padrao,
      quantidade: item.quantidade,
      unidade: item.unidade_padrao || item.unidade,
      categoria: item.categoria,
      embalagem: item.embalagem,
      catalogo_id: item.catalogo_id,
      confianca: item.confianca,
      texto_original: item.texto_original,
    }));

    return NextResponse.json({ itens });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = {
      faturamento: 12500,
      pedidos: 82,
      produtos: 342,
      fornecedores: 18,
      compras_mes: 5400,
      lucro_estimado: 7100,
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { calcularNecessidades } from "@/lib/engine-compras";

function getApiBaseUrl() {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    throw new Error("API_URL não configurada.");
  }

  return apiUrl.replace(/\/+$/, "");
}

function parseEmpresaId(req: NextRequest): string | null {
  const empresaId =
    req.headers.get("x-empresa-id") ||
    req.headers.get("x-empresa-id") ||
    req.nextUrl.searchParams.get("empresa_id");

  return empresaId?.trim() ? empresaId.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = parseEmpresaId(req);

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "Empresa não informada. Envie x-empresa-id, x-empresa-id ou ?empresa_id=...",
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();

    const estoqueRes = await fetch(`${apiBaseUrl}/estoque?empresa_id=${encodeURIComponent(empresaId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-empresa-id": empresaId,
      },
      cache: "no-store",
    });

    if (!estoqueRes.ok) {
      const details = await estoqueRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Erro ao buscar estoque para gerar necessidades.",
          details: details || `HTTP ${estoqueRes.status}`,
        },
        { status: estoqueRes.status }
      );
    }

    const produtos = await estoqueRes.json();
    const necessidades = calcularNecessidades(Array.isArray(produtos) ? produtos : []);

    const resultados: Array<{
      produto_id: string;
      produto: string;
      ok: boolean;
      status?: number;
      details?: string;
    }> = [];

    for (const item of necessidades) {
      const listaRes = await fetch(`${apiBaseUrl}/lista-compras`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-empresa-id": empresaId,
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          produto_id: item.produto_id,
          produto: item.produto,
          quantidade: item.quantidade,
          unidade: item.unidade,
          status: "sugerido",
        }),
      });

      if (!listaRes.ok) {
        const details = await listaRes.text().catch(() => "");
        resultados.push({
          produto_id: item.produto_id,
          produto: item.produto,
          ok: false,
          status: listaRes.status,
          details: details || `HTTP ${listaRes.status}`,
        });
        continue;
      }

      resultados.push({
        produto_id: item.produto_id,
        produto: item.produto,
        ok: true,
      });
    }

    return NextResponse.json({
      gerados: necessidades.length,
      salvos: resultados.filter((item) => item.ok).length,
      falhas: resultados.filter((item) => !item.ok).length,
      necessidades,
      resultados,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao gerar necessidades",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

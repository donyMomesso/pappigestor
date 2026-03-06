import { NextRequest, NextResponse } from "next/server";

type EstoqueRow = Record<string, any>;

function pick<T = any>(obj: any, keys: string[], fallback?: T): T {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return fallback as T;
}

function toNumber(v: any, def = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : def;
}

function ceilSmart(n: number) {
  if (n <= 0) return 0;
  return Math.ceil(n * 100) / 100;
}

function getBaseUrl(req: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (envUrl) {
    if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
      return envUrl;
    }
    return `https://${envUrl}`;
  }

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host");
  return `${protocol}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const empresaId = req.headers.get("x-empresa-id") || "";

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (empresaId) {
      defaultHeaders["x-empresa-id"] = empresaId;
    }

    const estoqueRes = await fetch(`${baseUrl}/api/estoque`, {
      method: "GET",
      headers: defaultHeaders,
      cache: "no-store",
    });

    if (!estoqueRes.ok) {
      return NextResponse.json(
        {
          error: "Não consegui ler /api/estoque. Verifique se o endpoint existe.",
          details: await estoqueRes.text(),
        },
        { status: 400 }
      );
    }

    const estoqueJson = await estoqueRes.json();

    const rows: EstoqueRow[] = Array.isArray(estoqueJson)
      ? estoqueJson
      : Array.isArray(estoqueJson?.items)
      ? estoqueJson.items
      : Array.isArray(estoqueJson?.data)
      ? estoqueJson.data
      : [];

    if (!rows.length) {
      return NextResponse.json({
        ok: true,
        criados: 0,
        atualizados: 0,
        ignorados: 0,
        mensagem: "Estoque vazio/sem dados.",
      });
    }

    const listaRes = await fetch(`${baseUrl}/api/lista-compras`, {
      method: "GET",
      headers: defaultHeaders,
      cache: "no-store",
    });

    const listaAtual = listaRes.ok ? await listaRes.json() : [];
    const listaArray: any[] = Array.isArray(listaAtual)
      ? listaAtual
      : Array.isArray(listaAtual?.items)
      ? listaAtual.items
      : Array.isArray(listaAtual?.data)
      ? listaAtual.data
      : [];

    const mapLista = new Map<string, any>();

    for (const item of listaArray) {
      const produtoId = String(item.produto_id ?? item.produtoId ?? item.id_produto ?? "");
      const status = String(item.status ?? "").toLowerCase();

      if (!produtoId) continue;
      if (["concluido", "finalizado", "cancelado", "recebido"].includes(status)) continue;

      mapLista.set(produtoId, item);
    }

    const necessidades = rows
      .map((r) => {
        const produto_id = String(
          pick(r, ["produto_id", "produtoId", "id_produto", "id", "produto_uuid"], "")
        );

        const produto = String(
          pick(r, ["produto", "produto_nome", "nome", "descricao", "nome_produto"], "Produto")
        );

        const unidade = String(
          pick(r, ["unidade", "un", "unidade_compra", "unidade_medida"], "un")
        );

        const saldo = toNumber(
          pick(r, ["saldo", "quantidade", "qtd", "estoque_atual", "atual", "quantidade_atual"], 0)
        );

        const minimo = toNumber(
          pick(r, ["minimo", "estoque_minimo", "qtd_minima", "ponto_pedido"], 0)
        );

        const alvo = toNumber(
          pick(r, ["alvo", "estoque_alvo", "par", "ideal"], 0)
        );

        const meta = alvo > 0 ? alvo : minimo;
        const falta = ceilSmart(meta - saldo);

        return {
          produto_id,
          produto,
          unidade,
          saldo,
          minimo,
          alvo,
          meta,
          falta,
        };
      })
      .filter((x) => x.produto_id && x.falta > 0);

    if (!necessidades.length) {
      return NextResponse.json({
        ok: true,
        criados: 0,
        atualizados: 0,
        ignorados: rows.length,
        mensagem: "Nenhuma necessidade encontrada (estoque saudável).",
      });
    }

    let criados = 0;
    let atualizados = 0;
    const erros: Array<{ produto_id: string; produto: string; erro: string }> = [];

    for (const n of necessidades) {
      const existente = mapLista.get(n.produto_id);

      const payload = {
        produto_id: Number.isNaN(Number(n.produto_id)) ? n.produto_id : Number(n.produto_id),
        produto: n.produto,
        quantidade_solicitada: n.falta,
        unidade: n.unidade,
        status: "sugerido",
        observacao: `Gerado automaticamente pelo estoque. Saldo: ${n.saldo} / Meta: ${n.meta}`,
      };

      try {
        if (existente?.id) {
          const qtdExistente = toNumber(
            existente.quantidade_solicitada ??
              existente.quantidade ??
              existente.qtd ??
              existente.quantidade_sugerida,
            0
          );

          const novaQtd = Math.max(qtdExistente, n.falta);

          const updatePayload = {
            ...payload,
            quantidade_solicitada: novaQtd,
          };

          const upRes = await fetch(`${baseUrl}/api/lista-compras/${existente.id}`, {
            method: "PATCH",
            headers: defaultHeaders,
            body: JSON.stringify(updatePayload),
          });

          if (upRes.ok) {
            atualizados++;
          } else {
            erros.push({
              produto_id: String(n.produto_id),
              produto: n.produto,
              erro: await upRes.text(),
            });
          }
        } else {
          const crRes = await fetch(`${baseUrl}/api/lista-compras`, {
            method: "POST",
            headers: defaultHeaders,
            body: JSON.stringify(payload),
          });

          if (crRes.ok) {
            criados++;
          } else {
            erros.push({
              produto_id: String(n.produto_id),
              produto: n.produto,
              erro: await crRes.text(),
            });
          }
        }
      } catch (err: any) {
        erros.push({
          produto_id: String(n.produto_id),
          produto: n.produto,
          erro: String(err?.message ?? err),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      criados,
      atualizados,
      total_necessidades: necessidades.length,
      necessidades,
      erros,
    });
  } catch (e: any) {
    console.error("Falha ao gerar lista do estoque:", e);
    return NextResponse.json(
      {
        error: "Falha ao gerar lista do estoque",
        details: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
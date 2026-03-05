import { NextResponse } from "next/server";

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
  // pra não comprar "0.2" de caixa sem querer
  if (n <= 0) return 0;
  return Math.ceil(n * 100) / 100; // 2 casas
}

export async function POST(req: Request) {
  try {
    /**
     * ✅ Este endpoint:
     * - Lê o estoque atual
     * - Calcula necessidade = meta/minimo - saldo
     * - Cria/atualiza itens em /api/lista-compras com status "sugerido"
     *
     * IMPORTANTE:
     * - Ele depende que seu /api/estoque (ou equivalente) exista.
     * - E que /api/lista-compras aceite POST (ou PUT) com item.
     */

    // 1) Busca estoque (tenta endpoints comuns do seu projeto)
    const estoqueRes =
      (await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/estoque`, { cache: "no-store" }).catch(() => null)) ||
      (await fetch(`/api/estoque`, { cache: "no-store" }).catch(() => null));

    if (!estoqueRes || !("ok" in estoqueRes) || !estoqueRes.ok) {
      return NextResponse.json(
        { error: "Não consegui ler /api/estoque. Verifique se o endpoint existe." },
        { status: 400 }
      );
    }

    const estoqueJson = await estoqueRes.json();

    // 2) Normaliza array
    const rows: EstoqueRow[] = Array.isArray(estoqueJson)
      ? estoqueJson
      : Array.isArray(estoqueJson?.items)
      ? estoqueJson.items
      : Array.isArray(estoqueJson?.data)
      ? estoqueJson.data
      : [];

    if (!rows.length) {
      return NextResponse.json({ ok: true, criados: 0, atualizados: 0, ignorados: 0, mensagem: "Estoque vazio/sem dados." });
    }

    // 3) Puxa lista de compras atual (pra fazer upsert)
    const listaRes =
      (await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/lista-compras`, { cache: "no-store" }).catch(() => null)) ||
      (await fetch(`/api/lista-compras`, { cache: "no-store" }).catch(() => null));

    const listaAtual = listaRes && "ok" in listaRes && listaRes.ok ? await listaRes.json() : [];
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
      // só consideramos "abertos": sugerido/pendente/cotando/aprovado etc.
      if (["concluido", "finalizado", "cancelado"].includes(status)) continue;
      mapLista.set(produtoId, item);
    }

    // 4) Calcula necessidades
    const necessidades = rows
      .map((r) => {
        const produto_id = String(
          pick(r, ["produto_id", "produtoId", "id_produto", "id", "produto_uuid"], "")
        );
        const produto = String(pick(r, ["produto", "produto_nome", "nome", "descricao"], "Produto"));
        const unidade = String(pick(r, ["unidade", "un", "unidade_compra", "unidade_medida"], "un"));

        const saldo = toNumber(pick(r, ["saldo", "quantidade", "qtd", "estoque_atual", "atual"], 0));
        const minimo = toNumber(pick(r, ["minimo", "estoque_minimo", "qtd_minima", "ponto_pedido"], 0));
        const alvo = toNumber(pick(r, ["alvo", "estoque_alvo", "par", "ideal"], 0));

        const meta = alvo > 0 ? alvo : minimo; // usa alvo se existir, senão mínimo
        const falta = ceilSmart(meta - saldo);

        return { produto_id, produto, unidade, saldo, meta, falta };
      })
      .filter((x) => x.produto_id && x.falta > 0);

    if (!necessidades.length) {
      return NextResponse.json({ ok: true, criados: 0, atualizados: 0, ignorados: rows.length, mensagem: "Nenhuma necessidade encontrada (estoque saudável)." });
    }

    // 5) Upsert na lista de compras
    let criados = 0;
    let atualizados = 0;

    for (const n of necessidades) {
      const existente = mapLista.get(n.produto_id);

      // payload padrão (SaaS)
      const payload = {
        produto_id: n.produto_id,
        produto: n.produto,
        quantidade: n.falta,
        unidade: n.unidade,
        status: "sugerido",
        origem: "estoque_auto",
        observacao: `Auto: saldo ${n.saldo} / meta ${n.meta}`,
      };

      if (existente?.id) {
        // atualiza (mantém maior quantidade, pra não reduzir sem querer)
        const qtdExistente = toNumber(existente.quantidade ?? existente.qtd ?? existente.quantidade_sugerida, 0);
        const novaQtd = Math.max(qtdExistente, n.falta);

        const updatePayload = {
          ...payload,
          id: existente.id,
          quantidade: novaQtd,
        };

        const upRes = await fetch(`/api/lista-compras/${existente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }).catch(() => null);

        if (upRes && "ok" in upRes && upRes.ok) atualizados++;
      } else {
        const crRes = await fetch(`/api/lista-compras`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (crRes && "ok" in crRes && crRes.ok) criados++;
      }
    }

    return NextResponse.json({
      ok: true,
      criados,
      atualizados,
      total_necessidades: necessidades.length,
      necessidades,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Falha ao gerar lista do estoque", details: String(e?.message ?? e) }, { status: 500 });
  }
}

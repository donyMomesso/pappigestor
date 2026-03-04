import { jsonResponse } from "@/lib/gemini";

type SugestaoIA = {
  id: string;
  tipo: "estoque" | "cotacao" | "unidade" | "economia" | "processo";
  titulo: string;
  detalhe: string;
  acao?: { label: string };
};

function normalizeUn(u?: string) {
  return (u || "").trim().toLowerCase();
}

function isUnitWeird(u?: string) {
  const x = normalizeUn(u);
  const ok = new Set(["un", "kg", "g", "l", "ml", "cx", "pct", "fd", "pc", "sc"]);
  return x && !ok.has(x);
}

// Motor local do servidor (mesmo sem plano IA)
function gerarSugestoesLocais(payload: any): SugestaoIA[] {
  const itens = payload?.itens || [];
  const estoqueBaixo = payload?.estoqueBaixo || [];
  const fornecedores = payload?.fornecedores || [];
  const produtos = payload?.produtos || [];

  const sugestoes: SugestaoIA[] = [];

  // 1) estoque baixo
  for (const e of estoqueBaixo) {
    const jaNaLista = itens.some(
      (i: any) => i.produto_id === e.produto_id && ["pendente", "em_cotacao"].includes(i.status_solicitacao)
    );
    if (!jaNaLista) {
      const qtdAtual = Number(e.quantidade_atual || 0);
      const qtdMin = Number(e.estoque_minimo || 0);
      const qtdSugerida = Math.max(1, qtdMin - qtdAtual);

      sugestoes.push({
        id: `stk-${e.produto_id}`,
        tipo: "estoque",
        titulo: `Reposição sugerida: ${e.produto_nome}`,
        detalhe: `Estoque atual (${qtdAtual}) abaixo do mínimo (${qtdMin}). Sugestão: lançar ${qtdSugerida} ${e.unidade_medida || ""}.`,
        acao: { label: `Lançar ${qtdSugerida}` },
      });
    }
  }

  // 2) unidade estranha
  for (const i of itens) {
    if (isUnitWeird(i?.unidade_medida)) {
      sugestoes.push({
        id: `un-${i.id}`,
        tipo: "unidade",
        titulo: `Unidade fora do padrão em “${i.produto_nome}”`,
        detalhe: `A unidade está “${i.unidade_medida}”. Padrões aceitos: un/kg/g/L/ml/cx/pct/fd/pc/sc. Padronize para evitar erro de preço (kg vs cx).`,
      });
    }
  }

  // 3) pendências
  const pendentes = itens.filter((x: any) => x?.status_solicitacao === "pendente");
  if (pendentes.length >= 5) {
    sugestoes.push({
      id: `proc-cot`,
      tipo: "processo",
      titulo: `Você tem ${pendentes.length} itens pendentes`,
      detalhe: `Sugestão: selecione itens e envie cotação por WhatsApp para acelerar compras.`,
    });
  }

  // 4) fornecedor preferencial sem zap
  const fornecedoresComZap = new Set((fornecedores || []).map((f: any) => String(f?.id)));
  const prefSemZap = (produtos || [])
    .filter((p: any) => p?.fornecedor_preferencial_id && !fornecedoresComZap.has(String(p.fornecedor_preferencial_id)))
    .slice(0, 3);

  for (const p of prefSemZap) {
    sugestoes.push({
      id: `forn-${p.id}`,
      tipo: "cotacao",
      titulo: `Fornecedor preferencial sem WhatsApp (produto: ${p.nome_produto})`,
      detalhe: `Esse produto tem fornecedor preferencial, mas não encontrei WhatsApp cadastrado. Sugestão: atualizar cadastro do fornecedor para cotação rápida.`,
    });
  }

  // 5) produtos sem histórico de preço
  const semPreco = (produtos || []).filter((p: any) => p?.ultimo_preco_pago == null).slice(0, 3);
  for (const p of semPreco) {
    sugestoes.push({
      id: `eco-${p.id}`,
      tipo: "economia",
      titulo: `Sem histórico de preço: ${p.nome_produto}`,
      detalhe: `Sugestão: quando lançar compra, registre valor unitário/kg. Isso habilita alerta de aumento e ranking de fornecedor.`,
    });
  }

  return sugestoes.slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // ✅ Hoje: roda SEM IA (motor local)
    // ✅ Amanhã: quando tiver plano, você pode chamar o Gemini aqui e substituir/mesclar
    const sugestoes = gerarSugestoesLocais(body);

    return jsonResponse({ sugestoes });
  } catch (e: any) {
    return jsonResponse({ sugestoes: [], error: e?.message || "Erro interno" }, 500);
  }
}

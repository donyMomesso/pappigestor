import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado");
  }

  return createClient(url, key);
}

function getEmpresaId(req: NextRequest): string | null {
  return req.headers.get("x-empresa-id");
}

function formatLinhaDigitavel(seed: number): string {
  const base = `${seed}`.padStart(47, "0").slice(0, 47);
  return `${base.slice(0, 5)}.${base.slice(5, 10)} ${base.slice(10, 15)}.${base.slice(
    15,
    21
  )} ${base.slice(21, 26)}.${base.slice(26, 32)} ${base.slice(32, 33)} ${base.slice(33, 47)}`;
}

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function guessCategoria(fornecedorNome: string): string {
  const nome = fornecedorNome.toLowerCase();

  if (
    nome.includes("embal") ||
    nome.includes("caixa") ||
    nome.includes("sacola")
  ) {
    return "Embalagens";
  }

  if (
    nome.includes("frios") ||
    nome.includes("insumos") ||
    nome.includes("alimentos") ||
    nome.includes("distribuidora") ||
    nome.includes("atacad")
  ) {
    return "Insumos e Ingredientes";
  }

  if (
    nome.includes("energia") ||
    nome.includes("eletrica") ||
    nome.includes("cpfl")
  ) {
    return "Energia Elétrica";
  }

  if (
    nome.includes("agua") ||
    nome.includes("sanasa")
  ) {
    return "Água";
  }

  if (
    nome.includes("internet") ||
    nome.includes("telefone") ||
    nome.includes("vivo") ||
    nome.includes("claro")
  ) {
    return "Internet e Telefone";
  }

  return "Outros";
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;

    if (!empresaId) {
      return NextResponse.json({ error: "x-empresa-id não enviado" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: conexao, error: conexaoError } = await supabase
      .from("conexoes_bancarias")
      .select("*")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (conexaoError) {
      return NextResponse.json({ error: conexaoError.message }, { status: 500 });
    }

    if (!conexao) {
      return NextResponse.json({ error: "Conexão bancária não encontrada" }, { status: 404 });
    }

    const boletosSeed = [
      {
        fornecedor_nome: "Atacadão dos Insumos",
        valor: 487.9,
        vencimento: addDays(2),
      },
      {
        fornecedor_nome: "Distribuidora Campinas Frios",
        valor: 1298.5,
        vencimento: addDays(5),
      },
      {
        fornecedor_nome: "Embalagens Premium",
        valor: 362.4,
        vencimento: addDays(7),
      },
    ];

    let importados = 0;
    let duplicados = 0;
    let lancamentosCriados = 0;

    for (let i = 0; i < boletosSeed.length; i++) {
      const seed = boletosSeed[i];
      const linha = formatLinhaDigitavel(Number(`${Date.now()}`.slice(-10)) + i);

      const { data: boletoExistente } = await supabase
        .from("boletos_dda")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("fornecedor_nome", seed.fornecedor_nome)
        .eq("valor", seed.valor)
        .eq("vencimento", seed.vencimento)
        .maybeSingle();

      let boletoId: string | null = null;

      if (boletoExistente) {
        duplicados++;
        boletoId = boletoExistente.id;
      } else {
        const { data: novoBoleto, error: insertError } = await supabase
          .from("boletos_dda")
          .insert({
            empresa_id: empresaId,
            fornecedor_nome: seed.fornecedor_nome,
            valor: seed.valor,
            vencimento: seed.vencimento,
            codigo_barras: linha.replace(/\D/g, "").slice(0, 44),
            linha_digitavel: linha,
            status_pagamento: "pendente",
            data_pagamento: null,
          })
          .select("id")
          .single();

        if (!insertError && novoBoleto) {
          importados++;
          boletoId = novoBoleto.id;
        }
      }

      const { data: lancamentoExistente } = await supabase
        .from("lancamentos")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("fornecedor", seed.fornecedor_nome)
        .eq("valor_previsto", seed.valor)
        .eq("vencimento_real", seed.vencimento)
        .maybeSingle();

      if (!lancamentoExistente) {
        const { error: lancamentoError } = await supabase.from("lancamentos").insert({
          empresa_id: empresaId,
          data_pedido: new Date().toISOString().split("T")[0],
          fornecedor: seed.fornecedor_nome,
          categoria: guessCategoria(seed.fornecedor_nome),
          valor_previsto: seed.valor,
          is_boleto_recebido: true,
          valor_real: seed.valor,
          vencimento_real: seed.vencimento,
          status_pagamento: "pendente",
          data_pagamento: null,
          anexo_url: null,
          comprovante_url: null,
          observacao: boletoId
            ? `Boleto DDA importado automaticamente. boleto_id=${boletoId}`
            : "Boleto DDA importado automaticamente.",
          is_manual: false,
        });

        if (!lancamentoError) {
          lancamentosCriados++;
        }
      }
    }

    await supabase
      .from("conexoes_bancarias")
      .update({
        ultima_sincronizacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "ativo",
      })
      .eq("id", id)
      .eq("empresa_id", empresaId);

    return NextResponse.json({
      success: true,
      importados,
      duplicados,
      total: boletosSeed.length,
      lancamentosCriados,
    });
  } catch (error) {
    console.error("Erro POST /api/pluggy/sincronizar-boletos/[id]:", error);
    return NextResponse.json(
      { error: "Erro interno ao sincronizar boletos" },
      { status: 500 }
    );
  }
}
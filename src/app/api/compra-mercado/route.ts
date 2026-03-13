import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveEmpresaId } from "@/lib/pappi-server";

export const runtime = "nodejs";

type DadosNfce = {
  emitente?: {
    razao_social?: string;
    nome_fantasia?: string;
    cnpj?: string;
    endereco?: string;
  };
  itens?: Array<{
    descricao?: string;
    quantidade?: number;
    unidade?: string;
    valor_unitario?: number;
    valor_total?: number;
  }>;
  totais?: {
    total?: number;
  };
  dados_nfce?: {
    numero?: string;
    serie?: string;
    data_emissao?: string;
    chave_acesso?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const dados = (body?.dados_nfce || {}) as DadosNfce;
    const categoria = String(body?.categoria || "Mercado");
    const fornecedorNome =
      dados?.emitente?.nome_fantasia || dados?.emitente?.razao_social || "Fornecedor não identificado";
    const valorTotal = Number(dados?.totais?.total || 0) || 0;
    const itens = Array.isArray(dados?.itens) ? dados.itens : [];

    if (!itens.length) {
      return NextResponse.json({ error: "Nenhum item encontrado para registrar a compra" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let fornecedorId: string | number | null = null;
    let fornecedorCriado = false;

    const { data: fornecedorExistente } = await supabase
      .from("fornecedores")
      .select("id, nome_fantasia, razao_social")
      .eq("empresa_id", empresaId)
      .or(`nome_fantasia.eq.${fornecedorNome},razao_social.eq.${fornecedorNome}`)
      .maybeSingle();

    if (fornecedorExistente?.id) {
      fornecedorId = fornecedorExistente.id;
    } else {
      const { data: novoFornecedor } = await supabase
        .from("fornecedores")
        .insert({
          empresa_id: empresaId,
          nome_fantasia: fornecedorNome,
          razao_social: dados?.emitente?.razao_social || fornecedorNome,
          cnpj: dados?.emitente?.cnpj || null,
          endereco: dados?.emitente?.endereco || null,
          categoria_principal: categoria,
        })
        .select("id")
        .maybeSingle();

      if (novoFornecedor?.id) {
        fornecedorId = novoFornecedor.id;
        fornecedorCriado = true;
      }
    }

    const { data: lancamento, error: lancamentoError } = await supabase
      .from("lancamentos")
      .insert({
        empresa_id: empresaId,
        data_pedido: dados?.dados_nfce?.data_emissao?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        fornecedor: fornecedorNome,
        categoria,
        valor_previsto: valorTotal,
        valor_real: valorTotal,
        data_pagamento: dados?.dados_nfce?.data_emissao?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        status_pagamento: "pago",
        is_boleto_recebido: false,
        observacao: dados?.dados_nfce?.chave_acesso
          ? `Compra via NFC-e ${dados.dados_nfce.chave_acesso}`
          : "Compra via leitura de cupom/NFC-e",
        is_manual: false,
      })
      .select("id, valor_real, valor_previsto")
      .single();

    if (lancamentoError || !lancamento) {
      return NextResponse.json({ error: lancamentoError?.message || "Erro ao criar lançamento" }, { status: 500 });
    }

    await supabase.from("lancamento_itens").insert(
      itens.map((item) => ({
        empresa_id: empresaId,
        lancamento_id: lancamento.id,
        produto: String(item.descricao || "Item sem nome"),
        quantidade_pedida: Number(item.quantidade || 0) || 0,
        unidade: String(item.unidade || "un"),
        valor_unitario: Number(item.valor_unitario || 0) || 0,
      }))
    );

    return NextResponse.json({
      fornecedor_id: fornecedorId,
      fornecedor_criado: fornecedorCriado,
      lancamento_id: lancamento.id,
      itens_registrados: itens.length,
      valor_total: Number(lancamento.valor_real ?? lancamento.valor_previsto ?? valorTotal) || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao registrar compra" }, { status: 500 });
  }
}

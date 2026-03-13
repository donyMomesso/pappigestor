import { NextResponse } from 'next/server';
import {
  getEmpresaId,
  getSupabase,
  numberOrNull,
  nowIso,
  pickCategoriaCompra,
  safeTableExists,
  similarityScore,
  todayISO,
} from '../_financeiro/helpers';

export const runtime = 'nodejs';

type NfceItem = {
  codigo?: string;
  descricao?: string;
  quantidade?: number;
  unidade?: string;
  valor_unitario?: number;
  valor_total?: number;
};

function parseItens(items: unknown): NfceItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    codigo: String((item as any)?.codigo || ''),
    descricao: String((item as any)?.descricao || ''),
    quantidade: Number((item as any)?.quantidade || 0),
    unidade: String((item as any)?.unidade || 'un'),
    valor_unitario: Number((item as any)?.valor_unitario || 0),
    valor_total: Number((item as any)?.valor_total || 0),
  }));
}

export async function POST(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: 'x-empresa-id ou x-pizzaria-id não enviado' }, { status: 400 });
    }

    const body = await req.json();
    const dados = body?.dados_nfce;
    if (!dados) {
      return NextResponse.json({ error: 'dados_nfce é obrigatório' }, { status: 400 });
    }

    const fornecedor = String(
      dados?.emitente?.nome_fantasia ||
      dados?.emitente?.razao_social ||
      body?.fornecedor ||
      'Fornecedor não identificado'
    ).trim();

    const categoria = pickCategoriaCompra(body?.categoria || 'Mercado');
    const total = numberOrNull(dados?.totais?.total) ?? numberOrNull(body?.valor_total) ?? 0;
    const dataPedido = String(dados?.dados_nfce?.data_emissao || body?.data_pedido || todayISO());
    const numeroNota = String(dados?.dados_nfce?.numero || body?.numero_nota || '').trim();
    const chaveAcesso = String(dados?.dados_nfce?.chave_acesso || body?.chave_acesso || '').trim();
    const itens = parseItens(dados?.itens);

    const supabase = getSupabase();

    let fornecedorId: string | null = null;
    const fornecedoresAvailable = await safeTableExists(supabase, 'fornecedores');
    if (fornecedoresAvailable) {
      const { data: fornecedores } = await supabase.from('fornecedores').select('id,nome_fantasia').limit(200);
      const match = (fornecedores || [])
        .map((item) => ({ item, score: similarityScore(item.nome_fantasia, fornecedor) }))
        .sort((a, b) => b.score - a.score)[0];
      if (match?.score >= 0.88) {
        fornecedorId = String(match.item.id);
      }
    }

    const lancamentoPayload: Record<string, unknown> = {
      empresa_id: empresaId,
      data_pedido: dataPedido,
      fornecedor,
      categoria,
      valor_previsto: total,
      valor_real: total,
      is_boleto_recebido: false,
      vencimento_real: null,
      status_pagamento: 'pendente',
      data_pagamento: null,
      anexo_url: body?.anexo_url || null,
      comprovante_url: null,
      observacao: body?.observacao || `Compra importada via Compra Mercado em ${todayISO()}`,
      is_manual: false,
      origem_modulo: 'compra_mercado',
      fornecedor_id: fornecedorId,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    const { data: lancamento, error: lancError } = await supabase
      .from('lancamentos')
      .insert(lancamentoPayload)
      .select('*')
      .single();

    if (lancError) {
      return NextResponse.json({ error: lancError.message }, { status: 500 });
    }

    let itensRegistrados = 0;
    const itensAvailable = await safeTableExists(supabase, 'itens');
    if (itensAvailable && itens.length > 0) {
      const payloadItens = itens.map((item) => ({
        lancamento_id: lancamento.id,
        produto: item.descricao || 'Item sem descrição',
        quantidade_pedida: Number(item.quantidade || 0),
        quantidade_recebida: null,
        valor_unitario: Number(item.valor_unitario || 0),
        total: Number(item.valor_total || 0),
        unidade: item.unidade || 'un',
        created_at: nowIso(),
        updated_at: nowIso(),
      }));

      const { data: itensData, error: itensError } = await supabase.from('itens').insert(payloadItens).select('id');
      if (!itensError) {
        itensRegistrados = itensData?.length || 0;
      }
    }

    const notasAvailable = await safeTableExists(supabase, 'notas_fiscais_recebidas');
    let notaFiscalId: string | null = null;
    if (notasAvailable && (numeroNota || chaveAcesso || total > 0)) {
      const { data: notaData, error: notaError } = await supabase
        .from('notas_fiscais_recebidas')
        .insert({
          empresa_id: empresaId,
          lancamento_id: lancamento.id,
          fornecedor,
          numero_nota: numeroNota || `NF-${Date.now()}`,
          data_emissao: dataPedido,
          chave_acesso: chaveAcesso || null,
          valor_total: total,
          arquivo_url: body?.anexo_url || null,
          origem_modulo: 'compra_mercado',
          status_conciliacao: 'pendente',
          created_at: nowIso(),
          updated_at: nowIso(),
        })
        .select('id')
        .single();

      if (!notaError) {
        notaFiscalId = notaData?.id || null;
        await supabase
          .from('lancamentos')
          .update({ nota_fiscal_id: notaFiscalId, updated_at: nowIso() })
          .eq('id', lancamento.id)
          .eq('empresa_id', empresaId);
      }
    }

    return NextResponse.json({
      fornecedor_id: fornecedorId,
      fornecedor_criado: false,
      lancamento_id: lancamento.id,
      nota_fiscal_id: notaFiscalId,
      itens_registrados: itensRegistrados,
      valor_total: total,
      origem: 'compra_mercado',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro POST /api/compra-mercado:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao registrar compra de mercado' }, { status: 500 });
  }
}

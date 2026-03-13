import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase, numberOrNull, upsertLancamentoFromBoleto, todayISO } from '../_financeiro/helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const supabase = getSupabase();

    let query = supabase
      .from('boletos_dda')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('vencimento', { ascending: true });

    if (status && status !== 'todos') query = query.eq('status_pagamento', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro GET /api/boletos-dda:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar boletos DDA' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });
    }

    const body = await req.json();
    const fornecedorNome = String(body.fornecedor_nome || body.fornecedor || '').trim();
    const valor = numberOrNull(body.valor);
    const vencimento = String(body.vencimento || body.vencimento_real || '').trim();

    if (!fornecedorNome || valor === null || !vencimento) {
      return NextResponse.json({ error: 'fornecedor_nome, valor e vencimento são obrigatórios' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      empresa_id: empresaId,
      fornecedor_nome: fornecedorNome,
      valor,
      vencimento,
      codigo_barras: body.codigo_barras || null,
      linha_digitavel: body.linha_digitavel || null,
      status_pagamento: body.status_pagamento || 'pendente',
      data_pagamento: body.data_pagamento || null,
      arquivo_url: body.arquivo_url || body.arquivo_url_boleto || null,
      cnpj_cedente: body.cnpj_cedente || null,
      nota_fiscal_id: body.nota_fiscal_id || null,
      lancamento_id: body.lancamento_id || null,
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    const { data, error } = await supabase.from('boletos_dda').insert(payload).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const lancamento = await upsertLancamentoFromBoleto({
      empresaId,
      fornecedor: fornecedorNome,
      valor,
      vencimento,
      boletoId: data.id,
      linhaDigitavel: body.linha_digitavel || null,
      codigoBarras: body.codigo_barras || null,
      arquivoUrl: (body.arquivo_url || body.arquivo_url_boleto || null) as string | null,
      observacao: body.observacao || `Boleto registrado em ${todayISO()}`,
      notaFiscalId: body.nota_fiscal_id || null,
      lancamentoId: body.lancamento_id || null,
    });

    return NextResponse.json({ ...data, lancamento }, { status: 201 });
  } catch (error) {
    console.error('Erro POST /api/boletos-dda:', error);
    return NextResponse.json({ error: 'Erro interno ao criar boleto DDA' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase, numberOrNull } from '../../_financeiro/helpers';

export const runtime = 'nodejs';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;

    if (!empresaId) {
      return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ('fornecedor_nome' in body || 'fornecedor' in body) updateData.fornecedor_nome = body.fornecedor_nome || body.fornecedor;
    if ('valor' in body) updateData.valor = numberOrNull(body.valor);
    if ('vencimento' in body) updateData.vencimento = body.vencimento;
    if ('codigo_barras' in body) updateData.codigo_barras = body.codigo_barras || null;
    if ('linha_digitavel' in body) updateData.linha_digitavel = body.linha_digitavel || null;
    if ('status_pagamento' in body) updateData.status_pagamento = body.status_pagamento;
    if ('data_pagamento' in body) updateData.data_pagamento = body.data_pagamento || null;
    if ('arquivo_url' in body) updateData.arquivo_url = body.arquivo_url || null;
    if ('nota_fiscal_id' in body) updateData.nota_fiscal_id = body.nota_fiscal_id || null;
    if ('lancamento_id' in body) updateData.lancamento_id = body.lancamento_id || null;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('boletos_dda')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data?.lancamento_id) {
      const lancamentoUpdate: Record<string, unknown> = {
        valor_real: data.valor,
        vencimento_real: data.vencimento,
        is_boleto_recebido: true,
        updated_at: new Date().toISOString(),
      };

      if (data.status_pagamento === 'pago') {
        lancamentoUpdate.data_pagamento = data.data_pagamento || new Date().toISOString();
        lancamentoUpdate.status_pagamento = 'pago';
      }

      await supabase
        .from('lancamentos')
        .update(lancamentoUpdate)
        .eq('id', data.lancamento_id)
        .eq('empresa_id', empresaId);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro PATCH /api/boletos-dda/[id]:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar boleto DDA' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;
    if (!empresaId) return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });

    const supabase = getSupabase();
    const { data: boleto, error: findError } = await supabase
      .from('boletos_dda')
      .select('id,lancamento_id,status_pagamento')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
    if (!boleto) return NextResponse.json({ error: 'Boleto não encontrado' }, { status: 404 });

    const { error } = await supabase.from('boletos_dda').delete().eq('id', id).eq('empresa_id', empresaId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (boleto.lancamento_id && boleto.status_pagamento !== 'pago') {
      await supabase
        .from('lancamentos')
        .update({
          is_boleto_recebido: false,
          valor_real: null,
          vencimento_real: null,
          boleto_dda_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', boleto.lancamento_id)
        .eq('empresa_id', empresaId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro DELETE /api/boletos-dda/[id]:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir boleto DDA' }, { status: 500 });
  }
}

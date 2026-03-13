import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase não configurado');
  return createClient(url, key);
}

function getEmpresaId(req: Request): string | null {
  const headers = new Headers(req.headers);
  return headers.get('x-empresa-id') || headers.get('x-pizzaria-id');
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const empresaId = getEmpresaId(req);
    if (!empresaId) return NextResponse.json({ error: 'Empresa não informada' }, { status: 400 });

    const supabase = getSupabase();
    const { data: lancamento, error } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!lancamento) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });

    const { data: itens, error: itensError } = await supabase
      .from('itens')
      .select('*')
      .eq('lancamento_id', id)
      .order('created_at', { ascending: true });

    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 500 });

    return NextResponse.json({ ...lancamento, itens: itens || [] });
  } catch (error) {
    console.error('Erro GET /api/lancamentos/[id]:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar lançamento' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;
    if (!empresaId) return NextResponse.json({ error: 'Empresa não informada. Envie x-empresa-id ou x-pizzaria-id.' }, { status: 400 });
    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if ('fornecedor' in body) updateData.fornecedor = String(body.fornecedor ?? '').trim();
    if ('categoria' in body) updateData.categoria = String(body.categoria ?? '').trim();
    if ('valor_previsto' in body) updateData.valor_previsto = toNumberOrNull(body.valor_previsto);
    if ('is_boleto_recebido' in body) updateData.is_boleto_recebido = Boolean(body.is_boleto_recebido);
    if ('valor_real' in body) updateData.valor_real = toNumberOrNull(body.valor_real);
    if ('vencimento_real' in body) updateData.vencimento_real = body.vencimento_real || null;
    if ('data_pagamento' in body) {
      updateData.data_pagamento = body.data_pagamento || null;
      updateData.status_pagamento = body.data_pagamento ? 'pago' : 'pendente';
    }
    if ('anexo_url' in body) updateData.anexo_url = body.anexo_url || null;
    if ('comprovante_url' in body) updateData.comprovante_url = body.comprovante_url || null;
    if ('observacao' in body) updateData.observacao = body.observacao || null;
    if ('linha_digitavel' in body) updateData.linha_digitavel = body.linha_digitavel || null;
    if ('arquivo_url_boleto' in body) updateData.arquivo_url_boleto = body.arquivo_url_boleto || null;
    if ('boleto_dda_id' in body) updateData.boleto_dda_id = body.boleto_dda_id || null;
    if ('nota_fiscal_id' in body) updateData.nota_fiscal_id = body.nota_fiscal_id || null;

    updateData.updated_at = new Date().toISOString();

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('lancamentos')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select('*')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Lançamento não encontrado para esta empresa' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro PATCH /api/lancamentos/[id]:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar lançamento' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const empresaId = getEmpresaId(req);
    const { id } = await context.params;
    if (!empresaId) return NextResponse.json({ error: 'Empresa não informada. Envie x-empresa-id ou x-pizzaria-id.' }, { status: 400 });
    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    const supabase = getSupabase();
    const { data: existente, error: findError } = await supabase
      .from('lancamentos')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
    if (!existente) return NextResponse.json({ error: 'Lançamento não encontrado para esta empresa' }, { status: 404 });

    const { error } = await supabase.from('lancamentos').delete().eq('id', id).eq('empresa_id', empresaId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro DELETE /api/lancamentos/[id]:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir lançamento' }, { status: 500 });
  }
}

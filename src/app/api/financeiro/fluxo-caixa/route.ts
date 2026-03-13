import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase } from '../../_financeiro/helpers';

export const runtime = 'nodejs';

type Bucket = {
  data: string;
  entradas: number;
  saidas_previstas: number;
  saidas_pagas: number;
  saldo_dia: number;
  saldo_acumulado: number;
};

function parseISO(value?: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function dateKey(dt: Date): string {
  return dt.toISOString().split('T')[0];
}

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: 'empresa_id não enviado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get('days') || 30), 7), 120);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('vencimento_real', { ascending: true, nullsFirst: false })
      .order('data_pedido', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fim = new Date(hoje);
    fim.setDate(fim.getDate() + days - 1);

    const buckets = new Map<string, Bucket>();
    for (let i = 0; i < days; i += 1) {
      const current = new Date(hoje);
      current.setDate(current.getDate() + i);
      const key = dateKey(current);
      buckets.set(key, {
        data: key,
        entradas: 0,
        saidas_previstas: 0,
        saidas_pagas: 0,
        saldo_dia: 0,
        saldo_acumulado: 0,
      });
    }

    for (const l of data || []) {
      const baseDate = parseISO(l.vencimento_real || l.data_pagamento || l.data_pedido);
      if (!baseDate) continue;
      if (baseDate < hoje || baseDate > fim) continue;
      const key = dateKey(baseDate);
      const bucket = buckets.get(key);
      if (!bucket) continue;

      const valorPrevisto = Number(l.valor_previsto ?? 0);
      const valorPago = Number(l.valor_real ?? l.valor_previsto ?? 0);
      const tipo = String(l.tipo || 'saida');
      const pago = l.status_pagamento === 'pago' || !!l.data_pagamento;

      if (tipo === 'entrada') {
        bucket.entradas += pago ? valorPago : valorPrevisto;
      } else {
        bucket.saidas_previstas += valorPrevisto;
        if (pago) bucket.saidas_pagas += valorPago;
      }
    }

    let saldoAcumulado = 0;
    const fluxo = Array.from(buckets.values()).map((bucket) => {
      bucket.saldo_dia = bucket.entradas - bucket.saidas_previstas;
      saldoAcumulado += bucket.saldo_dia;
      bucket.saldo_acumulado = saldoAcumulado;
      return bucket;
    });

    return NextResponse.json(fluxo);
  } catch (error) {
    console.error('Erro ao gerar fluxo de caixa:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar fluxo de caixa' },
      { status: 500 }
    );
  }
}

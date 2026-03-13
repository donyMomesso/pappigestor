import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase } from '../../_financeiro/helpers';

export const runtime = 'nodejs';

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: 'empresa_id não enviado' }, { status: 400 });
    }

    const supabase = getSupabase();
    const [lancamentosRes, boletosRes, notasRes] = await Promise.all([
      supabase.from('lancamentos').select('*').eq('empresa_id', empresaId),
      supabase.from('boletos_dda').select('*').eq('empresa_id', empresaId),
      supabase.from('notas_fiscais_recebidas').select('*').eq('empresa_id', empresaId),
    ]);

    if (lancamentosRes.error) {
      return NextResponse.json({ error: lancamentosRes.error.message }, { status: 500 });
    }
    if (boletosRes.error && !/relation .* does not exist/i.test(boletosRes.error.message)) {
      return NextResponse.json({ error: boletosRes.error.message }, { status: 500 });
    }
    if (notasRes.error && !/relation .* does not exist/i.test(notasRes.error.message)) {
      return NextResponse.json({ error: notasRes.error.message }, { status: 500 });
    }

    const lancamentos = lancamentosRes.data || [];
    const boletos = boletosRes.data || [];
    const notas = notasRes.data || [];
    const hoje = startOfToday();
    const seteDias = new Date(hoje);
    seteDias.setDate(seteDias.getDate() + 7);

    let pagarHoje = 0;
    let pagar7Dias = 0;
    let pagarAtrasado = 0;
    let totalPendente = 0;
    let totalPago = 0;
    let semBoleto = 0;
    let divergencias = 0;

    for (const l of lancamentos) {
      const valorBase = Number(l.valor_real ?? l.valor_previsto ?? 0);
      const venc = parseDate(l.vencimento_real);
      const statusPago = l.status_pagamento === 'pago' || !!l.data_pagamento;

      if (statusPago) {
        totalPago += Number(l.valor_real ?? l.valor_previsto ?? 0);
      } else {
        totalPendente += Number(l.valor_real ?? l.valor_previsto ?? 0);
        if (!l.is_boleto_recebido) semBoleto += 1;
        if (venc) {
          if (venc < hoje) pagarAtrasado += valorBase;
          if (venc.getTime() === hoje.getTime()) pagarHoje += valorBase;
          if (venc >= hoje && venc <= seteDias) pagar7Dias += valorBase;
        }
      }

      if (
        l.valor_real != null &&
        l.valor_previsto != null &&
        Math.abs(Number(l.valor_real) - Number(l.valor_previsto)) >= 0.01
      ) {
        divergencias += 1;
      }
    }

    return NextResponse.json({
      pagarHoje,
      pagar7Dias,
      pagarAtrasado,
      totalPendente,
      totalPago,
      totalLancamentos: lancamentos.length,
      totalBoletos: boletos.length,
      totalNotas: notas.length,
      semBoleto,
      divergencias,
      ticketMedioSaida:
        lancamentos.length > 0 ? totalPago / Math.max(lancamentos.filter((l) => l.status_pagamento === 'pago' || l.data_pagamento).length, 1) : 0,
    });
  } catch (err) {
    console.error('Erro ao gerar dashboard financeiro:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar dashboard financeiro' },
      { status: 500 }
    );
  }
}

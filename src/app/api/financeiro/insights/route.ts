import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase } from '../../_financeiro/helpers';
import { getGeminiModel } from '@/lib/gemini';

export const runtime = 'nodejs';

type AlertLevel = 'critico' | 'atencao' | 'ok';

type InsightAlert = {
  id: string;
  title: string;
  description: string;
  level: AlertLevel;
  value?: number;
  href?: string;
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function money(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: 'empresa_id não enviado' }, { status: 400 });
    }

    const supabase = getSupabase();
    const [lancRes, boletosRes, notasRes] = await Promise.all([
      supabase.from('lancamentos').select('*').eq('empresa_id', empresaId),
      supabase.from('boletos_dda').select('*').eq('empresa_id', empresaId),
      supabase.from('notas_fiscais_recebidas').select('*').eq('empresa_id', empresaId),
    ]);

    if (lancRes.error) return NextResponse.json({ error: lancRes.error.message }, { status: 500 });
    if (boletosRes.error && !/relation .* does not exist/i.test(boletosRes.error.message)) {
      return NextResponse.json({ error: boletosRes.error.message }, { status: 500 });
    }
    if (notasRes.error && !/relation .* does not exist/i.test(notasRes.error.message)) {
      return NextResponse.json({ error: notasRes.error.message }, { status: 500 });
    }

    const lancamentos = lancRes.data || [];
    const boletos = boletosRes.data || [];
    const notas = notasRes.data || [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alerts: InsightAlert[] = [];
    const vencidos = lancamentos.filter((l) => {
      const venc = parseDate(l.vencimento_real);
      return (l.status_pagamento !== 'pago' && !l.data_pagamento && venc && venc < hoje);
    });
    const valorVencido = vencidos.reduce((sum, l) => sum + Number(l.valor_real ?? l.valor_previsto ?? 0), 0);
    if (vencidos.length > 0) {
      alerts.push({
        id: 'vencidos',
        title: `${vencidos.length} conta(s) vencida(s)`,
        description: `Existe ${money(valorVencido)} em atraso no financeiro.`,
        level: 'critico',
        value: valorVencido,
        href: '/app/financeiro',
      });
    }

    const semBoleto = lancamentos.filter((l) => !l.is_boleto_recebido && l.status_pagamento !== 'pago');
    if (semBoleto.length > 0) {
      alerts.push({
        id: 'sem-boleto',
        title: `${semBoleto.length} compra(s) sem boleto/conta anexada`,
        description: 'O recebimento não fechou o ciclo com o financeiro nessas compras.',
        level: 'atencao',
        value: semBoleto.length,
        href: '/app/recebimento',
      });
    }

    const notasSemBoleto = notas.filter((nf) => !nf.boleto_dda_id && !nf.lancamento_id);
    if (notasSemBoleto.length > 0) {
      alerts.push({
        id: 'nf-sem-boleto',
        title: `${notasSemBoleto.length} NF(s) sem vínculo financeiro`,
        description: 'Há notas recebidas que ainda não geraram boleto ou lançamento conectado.',
        level: 'atencao',
        value: notasSemBoleto.length,
        href: '/app/recebimento',
      });
    }

    const duplicados = new Map<string, number>();
    for (const b of boletos) {
      const key = `${String(b.fornecedor_nome || '').trim().toLowerCase()}|${Number(b.valor || 0).toFixed(2)}|${b.vencimento || ''}`;
      duplicados.set(key, (duplicados.get(key) || 0) + 1);
    }
    const totalDuplicados = Array.from(duplicados.values()).filter((qtd) => qtd > 1).length;
    if (totalDuplicados > 0) {
      alerts.push({
        id: 'duplicados',
        title: `${totalDuplicados} possível(is) boleto(s) duplicado(s)`,
        description: 'Mesmo fornecedor, valor e vencimento apareceram mais de uma vez.',
        level: 'critico',
        value: totalDuplicados,
        href: '/app/boletos-dda',
      });
    }

    const divergencias = lancamentos.filter((l) => {
      if (l.valor_real == null || l.valor_previsto == null) return false;
      return Math.abs(Number(l.valor_real) - Number(l.valor_previsto)) >= 0.01;
    });
    if (divergencias.length > 0) {
      alerts.push({
        id: 'divergencias',
        title: `${divergencias.length} divergência(s) de valor`,
        description: 'O valor previsto da compra não bate com o valor real/boleto em parte dos lançamentos.',
        level: 'atencao',
        value: divergencias.length,
        href: '/app/financeiro',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'ok',
        title: 'Financeiro sob controle',
        description: 'Nenhum alerta crítico foi identificado no momento.',
        level: 'ok',
        href: '/app/financeiro',
      });
    }

    const topCategorias = Object.entries(
      lancamentos.reduce<Record<string, number>>((acc, item) => {
        const categoria = String(item.categoria || 'Outros');
        acc[categoria] = (acc[categoria] || 0) + Number(item.valor_real ?? item.valor_previsto ?? 0);
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoria, total]) => ({ categoria, total }));

    const deterministicSummary =
      alerts[0]?.level === 'critico'
        ? `Atenção máxima: ${alerts[0].title.toLowerCase()}. Priorize pagamentos vencidos, elimine possíveis duplicidades e feche o vínculo entre recebimento e financeiro.`
        : alerts[0]?.level === 'atencao'
        ? `Seu financeiro está operando, mas há pontos de atrito: ${alerts[0].title.toLowerCase()}. O melhor ganho agora é conectar melhor nota, boleto e lançamento.`
        : 'Seu financeiro está limpo no momento. Agora vale usar o módulo para ganhar previsibilidade e reduzir compras sem documento vinculado.';

    let aiSummary: string | null = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = getGeminiModel('gemini-1.5-flash');
        const prompt = `Você é um analista financeiro operacional de um app para restaurante/pizzaria.
Gere um resumo curto em PT-BR, objetivo e acionável, com no máximo 90 palavras.
Dados:
- alertas: ${JSON.stringify(alerts)}
- topCategorias: ${JSON.stringify(topCategorias)}
- totalLancamentos: ${lancamentos.length}
- totalBoletos: ${boletos.length}
- totalNotas: ${notas.length}`;
        const result = await model.generateContent(prompt);
        aiSummary = result.response.text().trim().slice(0, 600);
      } catch (error) {
        console.error('Falha ao gerar resumo IA do financeiro:', error);
      }
    }

    const actions = [
      {
        title: 'Fechar recebimentos pendentes',
        description: 'Registre NF e boleto no recebimento para não perder saída no fluxo de caixa.',
        href: '/app/recebimento',
      },
      {
        title: 'Revisar boletos vencidos ou duplicados',
        description: 'Cheque boletos já vencidos e remova duplicidades antes de pagar.',
        href: '/app/boletos-dda',
      },
      {
        title: 'Conferir maiores categorias de gasto',
        description: topCategorias.length > 0
          ? `Hoje o peso maior está em ${topCategorias.map((c) => `${c.categoria} (${money(c.total)})`).join(', ')}.`
          : 'Ainda não há volume suficiente para análise por categoria.',
        href: '/app/financeiro',
      },
    ];

    return NextResponse.json({
      summary: aiSummary || deterministicSummary,
      deterministicSummary,
      alerts,
      actions,
      topCategorias,
      totals: {
        lancamentos: lancamentos.length,
        boletos: boletos.length,
        notas: notas.length,
      },
      aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao gerar insights financeiros' },
      { status: 500 }
    );
  }
}

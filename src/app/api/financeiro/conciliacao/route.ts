import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase, normalizeText, numberOrNull, similarityScore } from '../../_financeiro/helpers';

function asDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sameWindow(a?: string | null, b?: string | null, days = 5): boolean {
  const ad = asDate(a);
  const bd = asDate(b);
  if (!ad || !bd) return false;
  const delta = Math.abs(ad.getTime() - bd.getTime());
  return delta <= days * 24 * 60 * 60 * 1000;
}

function closeMoney(a: unknown, b: unknown, tolerance = 0.5): boolean {
  const aa = numberOrNull(a);
  const bb = numberOrNull(b);
  if (aa === null || bb === null) return false;
  return Math.abs(aa - bb) <= tolerance;
}

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) return NextResponse.json({ error: 'empresa_id não enviado' }, { status: 400 });

    const supabase = getSupabase();
    const [lancRes, bolRes, nfRes] = await Promise.all([
      supabase.from('lancamentos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(300),
      supabase.from('boletos_dda').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(300),
      supabase.from('notas_fiscais_recebidas').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(300),
    ]);

    if (lancRes.error) return NextResponse.json({ error: lancRes.error.message }, { status: 500 });
    if (bolRes.error && !/relation .* does not exist/i.test(bolRes.error.message)) {
      return NextResponse.json({ error: bolRes.error.message }, { status: 500 });
    }
    if (nfRes.error && !/relation .* does not exist/i.test(nfRes.error.message)) {
      return NextResponse.json({ error: nfRes.error.message }, { status: 500 });
    }

    const lancamentos = lancRes.data || [];
    const boletos = bolRes.data || [];
    const notas = nfRes.data || [];

    const sugestoes = notas.flatMap((nota: any) => {
      const candidatos = lancamentos
        .map((lanc: any) => {
          const fornecedorScore = similarityScore(nota.fornecedor || '', lanc.fornecedor || '');
          const valorScore = closeMoney(nota.valor_total, lanc.valor_real ?? lanc.valor_previsto) ? 1 : 0;
          const dataScore = sameWindow(nota.data_emissao, lanc.data_pedido, 7) ? 0.5 : 0;
          const score = fornecedorScore + valorScore + dataScore;
          return { lancamento: lanc, score };
        })
        .filter((item) => item.score >= 1.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const boletoCandidates = boletos
        .map((boleto: any) => {
          const fornecedorScore = similarityScore(nota.fornecedor || '', boleto.fornecedor_nome || '');
          const valorScore = closeMoney(nota.valor_total, boleto.valor) ? 1 : 0;
          const dataScore = sameWindow(nota.data_emissao, boleto.vencimento, 15) ? 0.3 : 0;
          const score = fornecedorScore + valorScore + dataScore;
          return { boleto, score };
        })
        .filter((item) => item.score >= 1.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (candidatos.length === 0 && boletoCandidates.length === 0) return [];

      return [{
        nota_fiscal_id: nota.id,
        fornecedor: nota.fornecedor,
        numero_nota: nota.numero_nota,
        valor_total: nota.valor_total,
        top_lancamentos: candidatos.map((item) => ({
          id: item.lancamento.id,
          fornecedor: item.lancamento.fornecedor,
          valor: item.lancamento.valor_real ?? item.lancamento.valor_previsto,
          data: item.lancamento.data_pedido,
          score: Number(item.score.toFixed(2)),
        })),
        top_boletos: boletoCandidates.map((item) => ({
          id: item.boleto.id,
          fornecedor_nome: item.boleto.fornecedor_nome,
          valor: item.boleto.valor,
          vencimento: item.boleto.vencimento,
          score: Number(item.score.toFixed(2)),
        })),
      }];
    });

    const duplicidadesBoleto = boletos.reduce((acc: Record<string, number>, boleto: any) => {
      const key = `${normalizeText(boleto.fornecedor_nome)}|${Number(boleto.valor || 0).toFixed(2)}|${boleto.vencimento || ''}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      sugestoes,
      resumo: {
        notas_sem_vinculo: notas.filter((nota: any) => !nota.lancamento_id).length,
        boletos_sem_lancamento: boletos.filter((boleto: any) => !boleto.lancamento_id).length,
        possiveis_duplicidades: Object.values(duplicidadesBoleto).filter((qtd) => qtd > 1).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao gerar conciliação' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase } from '../_financeiro/helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });

    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const lancamentoId = searchParams.get('lancamento_id');

    let query = supabase
      .from('notas_fiscais_recebidas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (lancamentoId) query = query.eq('lancamento_id', lancamentoId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao buscar notas fiscais' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });

    const body = await req.json();
    if (!body.numero_nota) {
      return NextResponse.json({ error: 'numero_nota é obrigatório' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      empresa_id: empresaId,
      lancamento_id: body.lancamento_id || null,
      fornecedor: body.fornecedor || null,
      numero_nota: String(body.numero_nota),
      data_emissao: body.data_emissao || null,
      chave_acesso: body.chave_acesso || null,
      valor_total: body.valor_total ?? null,
      arquivo_url: body.arquivo_url || null,
      boleto_dda_id: body.boleto_dda_id || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notas_fiscais_recebidas')
      .insert(payload)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao registrar nota fiscal' }, { status: 500 });
  }
}

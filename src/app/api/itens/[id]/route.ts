import { NextResponse } from 'next/server';
import { getSupabase, numberOrNull } from '../../_financeiro/helpers';

export const runtime = 'nodejs';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const quantidadeRecebida = numberOrNull(body.quantidade_recebida);

    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });
    if (quantidadeRecebida === null) {
      return NextResponse.json({ error: 'quantidade_recebida inválida' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('itens')
      .update({ quantidade_recebida: quantidadeRecebida, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao atualizar item' }, { status: 500 });
  }
}

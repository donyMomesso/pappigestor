import { NextResponse } from 'next/server';
import { getEmpresaId, getSupabase, numberOrNull } from '../_financeiro/helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('empresa_config')
      .select('*')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error && !/relation .* does not exist/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      data ?? {
        empresa_id: empresaId,
        limite_aprovacao_pagamento: 1000,
        whatsapp_admin: '',
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao carregar empresa-config' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) return NextResponse.json({ error: 'x-empresa-id não enviado' }, { status: 400 });

    const body = await req.json();
    const limite = numberOrNull(body.limite_aprovacao_pagamento);
    const payload = {
      empresa_id: empresaId,
      limite_aprovacao_pagamento: limite ?? 0,
      whatsapp_admin: String(body.whatsapp_admin || ''),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('empresa_config')
      .upsert(payload, { onConflict: 'empresa_id' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao salvar empresa-config' }, { status: 500 });
  }
}

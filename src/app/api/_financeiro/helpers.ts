import fs from 'fs/promises';
import path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase não configurado');
  }

  return createClient(url, key);
}

export function getEmpresaIdFromHeaders(headers: Headers): string | null {
  const empresaId =
    headers.get('x-empresa-id') ||
    headers.get('x-pizzaria-id') ||
    headers.get('x-company-id');

  return empresaId && empresaId.trim() ? empresaId.trim() : null;
}

export function getEmpresaId(req: Request): string | null {
  return getEmpresaIdFromHeaders(new Headers(req.headers));
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function publicUploadsDir(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}

export async function resolveLocalUpload(imageUrl: string): Promise<{ mimeType: string; data: string }> {
  const pathname = imageUrl.startsWith('http')
    ? new URL(imageUrl).pathname
    : imageUrl;

  if (!pathname.startsWith('/uploads/')) {
    throw new Error('A leitura local aceita apenas URLs em /uploads');
  }

  const abs = path.join(process.cwd(), 'public', pathname.replace(/^\//, ''));
  const bytes = await fs.readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const mimeType =
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' :
    ext === '.pdf' ? 'application/pdf' :
    'image/jpeg';

  return { mimeType, data: bytes.toString('base64') };
}

export function normalizeText(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function similarityScore(a: unknown, b: unknown): number {
  const aa = normalizeText(a);
  const bb = normalizeText(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.85;

  const pa = aa.split(/\s+/).filter((x) => x.length > 2);
  const pb = bb.split(/\s+/).filter((x) => x.length > 2);
  if (pa.length === 0 || pb.length === 0) return 0;

  let matches = 0;
  for (const tokenA of pa) {
    if (pb.some((tokenB) => tokenA.includes(tokenB) || tokenB.includes(tokenA))) {
      matches += 1;
    }
  }
  return matches / Math.max(pa.length, pb.length);
}

export function pickCategoriaCompra(value?: string | null): string {
  const raw = normalizeText(value);
  if (!raw) return 'Mercado';
  if (raw.includes('embalag')) return 'Embalagens';
  if (raw.includes('bebid')) return 'Bebidas';
  if (raw.includes('limpez')) return 'Materiais de Limpeza';
  if (raw.includes('equip')) return 'Equipamentos';
  if (raw.includes('servic')) return 'Serviços Terceirizados';
  return value || 'Mercado';
}

export async function safeTableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
  if (!error) return true;
  return !/relation .* does not exist/i.test(error.message);
}

export async function upsertLancamentoFromBoleto(args: {
  empresaId: string;
  fornecedor: string;
  valor: number;
  vencimento: string;
  boletoId?: string;
  linhaDigitavel?: string | null;
  codigoBarras?: string | null;
  arquivoUrl?: string | null;
  observacao?: string | null;
  notaFiscalId?: string | null;
  lancamentoId?: string | null;
  categoria?: string | null;
  origemModulo?: string | null;
}) {
  const supabase = getSupabase();

  if (args.lancamentoId) {
    const updatePayload: Record<string, unknown> = {
      fornecedor: args.fornecedor,
      valor_real: args.valor,
      vencimento_real: args.vencimento,
      is_boleto_recebido: true,
      observacao: args.observacao || null,
      updated_at: nowIso(),
    };

    if (args.linhaDigitavel !== undefined) updatePayload.linha_digitavel = args.linhaDigitavel;
    if (args.codigoBarras !== undefined) updatePayload.codigo_barras = args.codigoBarras;
    if (args.arquivoUrl !== undefined) updatePayload.arquivo_url_boleto = args.arquivoUrl;
    if (args.boletoId) updatePayload.boleto_dda_id = args.boletoId;
    if (args.notaFiscalId !== undefined) updatePayload.nota_fiscal_id = args.notaFiscalId;
    if (args.categoria) updatePayload.categoria = args.categoria;
    if (args.origemModulo) updatePayload.origem_modulo = args.origemModulo;

    const { data, error } = await supabase
      .from('lancamentos')
      .update(updatePayload)
      .eq('id', args.lancamentoId)
      .eq('empresa_id', args.empresaId)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  const insertPayload: Record<string, unknown> = {
    empresa_id: args.empresaId,
    data_pedido: todayISO(),
    fornecedor: args.fornecedor,
    categoria: args.categoria || 'Outros',
    valor_previsto: args.valor,
    is_boleto_recebido: true,
    valor_real: args.valor,
    vencimento_real: args.vencimento,
    status_pagamento: 'pendente',
    data_pagamento: null,
    anexo_url: args.arquivoUrl || null,
    comprovante_url: null,
    observacao: args.observacao || null,
    is_manual: true,
    origem_modulo: args.origemModulo || 'recebimento',
  };

  if (args.linhaDigitavel !== undefined) insertPayload.linha_digitavel = args.linhaDigitavel;
  if (args.codigoBarras !== undefined) insertPayload.codigo_barras = args.codigoBarras;
  if (args.arquivoUrl !== undefined) insertPayload.arquivo_url_boleto = args.arquivoUrl;
  if (args.boletoId) insertPayload.boleto_dda_id = args.boletoId;
  if (args.notaFiscalId !== undefined) insertPayload.nota_fiscal_id = args.notaFiscalId;

  const { data, error } = await supabase
    .from('lancamentos')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

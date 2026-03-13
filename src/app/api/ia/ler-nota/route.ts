import { getGeminiModel, jsonResponse, errorResponse } from '@/lib/gemini';
import { resolveLocalUpload } from '../../_financeiro/helpers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let mimeType = '';
    let data = '';
    let extrairApenas: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      extrairApenas = String(form.get('extrair_apenas') || '').trim() || null;

      if (!file) return errorResponse('Arquivo não enviado (field: file)', 400);
      if (file.type === 'application/pdf') {
        return errorResponse('Leitura de PDF ainda não habilitada neste servidor. Envie imagem da nota.', 400);
      }
      if (!file.type.startsWith('image/')) {
        return errorResponse('Envie uma imagem (jpg/png/webp).', 400);
      }

      mimeType = file.type;
      data = Buffer.from(await file.arrayBuffer()).toString('base64');
    } else {
      const body = await req.json();
      extrairApenas = String(body?.extrair_apenas || '').trim() || null;
      const imageUrl = String(body?.image_url || '').trim();
      if (!imageUrl) return errorResponse('image_url não enviada', 400);
      const resolved = await resolveLocalUpload(imageUrl);
      if (resolved.mimeType === 'application/pdf') {
        return errorResponse('Leitura de PDF ainda não habilitada neste servidor. Envie imagem da nota.', 400);
      }
      mimeType = resolved.mimeType;
      data = resolved.data;
    }

    const model = getGeminiModel('gemini-2.5-flash');

    const prompt = extrairApenas === 'chave_acesso'
      ? `Leia a imagem e retorne APENAS JSON válido no formato {"chave_acesso": string | null}. Não invente valores.`
      : `Você vai ler uma foto de nota/cupom fiscal e extrair APENAS JSON válido no formato:
{
  "numero_nota": string | null,
  "data_emissao": string | null,
  "chave_acesso": string | null,
  "fornecedor": string | null,
  "valor_total": number | null,
  "itens": [
    { "produto": string, "qtd": number | null, "unidade": string | null, "valor_unitario": number | null, "valor_total": number | null }
  ]
}
Regras: não invente. Se não achar, use null. Data em YYYY-MM-DD quando possível.`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data } },
    ]);

    const raw = result.response.text().trim();
    const jsonText = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonText);
    return jsonResponse({ dados: parsed });
  } catch (e: any) {
    return errorResponse('Falha ao ler nota (imagem)', 500, { message: e?.message });
  }
}

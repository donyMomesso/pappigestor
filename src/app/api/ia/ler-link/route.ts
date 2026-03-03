import { getGeminiModel, jsonResponse, errorResponse } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    // 🔥 A CORREÇÃO ESTÁ AQUI: Dizemos ao TS que o body pode conter um 'url'
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = (body?.url || "").toString().trim();
    if (!url) return errorResponse("URL vazia", 400);

    // Busca HTML da página (quando liberar)
    const htmlRes = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,*/*",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const html = await htmlRes.text();

    // Se for bloqueado por captcha/login, evita 500
    if (!htmlRes.ok) {
      return errorResponse("Não consegui acessar o link (bloqueado ou inválido).", 400, {
        status: htmlRes.status,
      });
    }

    const model = getGeminiModel("gemini-2.5-flash");

    const prompt = `
Extraia dados de uma nota fiscal a partir do HTML.

Retorne JSON:
{
  "fornecedor": string | null,
  "cnpj": string | null,
  "total": number | null,
  "itens": [
    { "produto": string, "qtd": number, "unidade": string, "preco_un": number, "total_item": number | null }
  ]
}

Regras:
- Não invente. Se não achar, use null.
- Retorne APENAS JSON válido.

HTML (pode estar grande):
${html.slice(0, 200000)}
`.trim();

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonText = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText);

    return jsonResponse({ data: parsed });
  } catch (e: any) {
    return errorResponse("Falha ao ler link", 500, { message: e?.message });
  }
}
import { getGeminiModel, jsonResponse, errorResponse } from "@/lib/gemini";

type LinkBody = {
  url?: string;
};

type ItemExtraido = {
  produto: string;
  qtd: number;
  unidade: string;
  preco_un: number;
  total_item: number | null;
};

function normalizeUrl(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");

  if (!trimmed) {
    throw new Error("URL vazia");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("URL inválida");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Protocolo de URL inválido");
  }

  return parsed.toString();
}

function extractJsonFromModel(raw: string) {
  const text = raw.trim();

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1]);
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(sliced);
  }

  return JSON.parse(text);
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/\u0000/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumberBR(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseHtmlDirect(html: string) {
  const clean = html;

  const fornecedorMatch = clean.match(
    /DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR ELETRÔNICA\s+([^<\n]+?)\s+CNPJ:/i
  );
  const cnpjMatch = clean.match(/CNPJ:\s*([\d./-]+)/i);
  const totalMatch = clean.match(/Valor total R\$\:\s*([\d.,]+)/i);
  const numeroSerieEmissaoMatch = clean.match(
    /Número:\s*(\d+)\s+Série:\s*(\d+)\s+Emissão:\s*([0-9/: -]+)/i
  );
  const chaveMatch = clean.match(
    /Chave de acesso:\s*([0-9 ]{44,})/i
  );

  const itens: ItemExtraido[] = [];

  const itemRegex =
    /([A-ZÀ-Ú0-9.,()\-\/ ]+?)\s*\(Código:\s*[\d ]+\)\s*Qtde\.\:([\d.,]+)\s*UN\:\s*([A-Za-z]+)\s*Vl\. Unit\.\:\s*([\d.,]+)\s*Vl\. Total\s*([\d.,]+)/gi;

  let itemMatch: RegExpExecArray | null = null;
  while ((itemMatch = itemRegex.exec(clean)) !== null) {
    const produto = itemMatch[1]?.trim();
    const qtd = toNumberBR(itemMatch[2]) ?? 1;
    const unidade = itemMatch[3]?.trim() || "UN";
    const precoUn = toNumberBR(itemMatch[4]) ?? 0;
    const totalItem = toNumberBR(itemMatch[5]);

    if (produto) {
      itens.push({
        produto,
        qtd,
        unidade,
        preco_un: precoUn,
        total_item: totalItem,
      });
    }
  }

  return {
    fornecedor: fornecedorMatch?.[1]?.trim() || null,
    cnpj: cnpjMatch?.[1]?.trim() || null,
    total: toNumberBR(totalMatch?.[1]) ?? null,
    itens,
    numero_nota: numeroSerieEmissaoMatch?.[1] || null,
    serie: numeroSerieEmissaoMatch?.[2] || null,
    emissao: numeroSerieEmissaoMatch?.[3]?.trim() || null,
    chave_acesso: chaveMatch?.[1]?.replace(/\s+/g, "") || null,
  };
}

function hasUsefulDirectData(parsed: {
  fornecedor: string | null;
  cnpj: string | null;
  total: number | null;
  itens: ItemExtraido[];
}) {
  return Boolean(
    parsed.fornecedor ||
      parsed.cnpj ||
      parsed.total !== null ||
      (Array.isArray(parsed.itens) && parsed.itens.length > 0)
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as LinkBody | null;
    const rawUrl = body?.url?.toString() || "";

    let url: string;
    try {
      url = normalizeUrl(rawUrl);
    } catch (err: any) {
      return errorResponse(err?.message || "URL inválida", 400);
    }

    const htmlRes = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!htmlRes.ok) {
      return errorResponse("Não consegui acessar o link (bloqueado ou inválido).", 400, {
        status: htmlRes.status,
        statusText: htmlRes.statusText,
      });
    }

    const htmlRaw = await htmlRes.text();
    const html = sanitizeHtml(htmlRaw);

    // 1) Tenta parser direto primeiro
    const direct = parseHtmlDirect(html);

    if (hasUsefulDirectData(direct)) {
      return jsonResponse({
        data: {
          fornecedor: direct.fornecedor,
          cnpj: direct.cnpj,
          total: direct.total,
          itens: direct.itens,
          numero_nota: direct.numero_nota,
          serie: direct.serie,
          emissao: direct.emissao,
          chave_acesso: direct.chave_acesso,
        },
      });
    }

    // 2) Fallback para IA
    const model = getGeminiModel("gemini-2.5-flash");

    const prompt = `
Extraia dados de uma nota fiscal a partir do HTML abaixo.

Retorne JSON EXATAMENTE neste formato:
{
  "fornecedor": string | null,
  "cnpj": string | null,
  "total": number | null,
  "itens": [
    {
      "produto": string,
      "qtd": number,
      "unidade": string,
      "preco_un": number,
      "total_item": number | null
    }
  ],
  "numero_nota": string | null,
  "serie": string | null,
  "emissao": string | null,
  "chave_acesso": string | null
}

Regras:
- Não invente valores.
- Se não encontrar um campo, use null.
- Se não encontrar itens, retorne "itens": [].
- Retorne APENAS JSON válido, sem markdown, sem explicação.

HTML:
${html.slice(0, 180000)}
`.trim();

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let parsed: any;
    try {
      parsed = extractJsonFromModel(raw);
    } catch (err: any) {
      return errorResponse("A IA retornou um formato inválido ao ler o link.", 500, {
        rawPreview: raw.slice(0, 1000),
        message: err?.message || null,
      });
    }

    return jsonResponse({ data: parsed });
  } catch (e: any) {
    return errorResponse("Falha ao ler link", 500, { message: e?.message || null });
  }
}
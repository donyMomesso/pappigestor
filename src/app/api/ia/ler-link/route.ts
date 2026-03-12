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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

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
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }

  return JSON.parse(text);
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/\u0000/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function toNumberBR(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function uniqueItems(items: ItemExtraido[]): ItemExtraido[] {
  const seen = new Set<string>();
  const out: ItemExtraido[] = [];

  for (const item of items) {
    const key = [
      item.produto.toLowerCase(),
      item.qtd,
      item.unidade.toLowerCase(),
      item.preco_un,
      item.total_item ?? "null",
    ].join("|");

    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }

  return out;
}

function parseHtmlDirect(html: string) {
  const clean = html;

  const fornecedorMatch =
    clean.match(
      /DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR ELETRÔNICA\s+(.+?)\s+CNPJ:/i
    ) || clean.match(/NOME\/RAZÃO SOCIAL\s+(.+?)\s+CNPJ:/i);

  const cnpjMatch = clean.match(/CNPJ:\s*([\d./-]+)/i);
  const totalMatch =
    clean.match(/Valor total R\$\:?\s*([\d.,]+)/i) ||
    clean.match(/Valor a pagar R\$\:?\s*([\d.,]+)/i);

  const numeroSerieEmissaoMatch = clean.match(
    /Número:\s*(\d+)\s+Série:\s*(\d+)\s+Emissão:\s*([0-9/: -]+)/i
  );

  const chaveMatch = clean.match(/Chave de acesso:\s*([0-9 ]{44,})/i);

  const itens: ItemExtraido[] = [];

  const itemRegexA =
    /([A-ZÀ-Ú0-9.,()\-\/%+ ]+?)\s*\(Código:\s*[\d ]+\)\s*Qtde\.:\s*([\d.,]+)\s*UN:\s*([A-Za-z]+)\s*Vl\. Unit\.:\s*([\d.,]+)\s*Vl\. Total\s*([\d.,]+)/gi;

  let matchA: RegExpExecArray | null = null;
  while ((matchA = itemRegexA.exec(clean)) !== null) {
    const produto = matchA[1]?.trim();
    const qtd = toNumberBR(matchA[2]) ?? 1;
    const unidade = matchA[3]?.trim() || "UN";
    const precoUn = toNumberBR(matchA[4]) ?? 0;
    const totalItem = toNumberBR(matchA[5]);

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

  if (itens.length === 0) {
    const lines = clean
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        /Qtde\.:\s*[\d.,]+/i.test(line) &&
        /UN:\s*[A-Za-z]+/i.test(line) &&
        /Vl\. Unit\.:\s*[\d.,]+/i.test(line)
      ) {
        const produto = (lines[i - 1] || "")
          .replace(/\(Código:\s*[\d ]+\)/i, "")
          .trim();

        const qtdMatch = line.match(/Qtde\.:\s*([\d.,]+)/i);
        const unMatch = line.match(/UN:\s*([A-Za-z]+)/i);
        const unitMatch = line.match(/Vl\. Unit\.:\s*([\d.,]+)/i);
        const totalMatchItem = line.match(/Vl\. Total\s*([\d.,]+)/i);

        if (produto) {
          itens.push({
            produto,
            qtd: toNumberBR(qtdMatch?.[1]) ?? 1,
            unidade: unMatch?.[1] || "UN",
            preco_un: toNumberBR(unitMatch?.[1]) ?? 0,
            total_item: toNumberBR(totalMatchItem?.[1]),
          });
        }
      }
    }
  }

  return {
    fornecedor: fornecedorMatch?.[1]?.trim() || null,
    cnpj: cnpjMatch?.[1]?.trim() || null,
    total: toNumberBR(totalMatch?.[1]) ?? null,
    itens: uniqueItems(
      itens.filter((item) => item.produto && item.produto.trim().length > 1)
    ),
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
    } catch (error: unknown) {
      return errorResponse(getErrorMessage(error, "URL inválida"), 400);
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
      return errorResponse(
        "Não consegui acessar o link (bloqueado ou inválido).",
        400,
        {
          status: htmlRes.status,
          statusText: htmlRes.statusText,
        }
      );
    }

    const htmlRaw = await htmlRes.text();
    const html = sanitizeHtml(htmlRaw);

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
    } catch (error: unknown) {
      return errorResponse(
        "A IA retornou um formato inválido ao ler o link.",
        500,
        {
          rawPreview: raw.slice(0, 1000),
          message: getErrorMessage(error, "Falha ao interpretar JSON da IA"),
        }
      );
    }

    const itens = Array.isArray(parsed?.itens)
      ? parsed.itens
          .map((item: any) => ({
            produto: String(item?.produto || item?.nome || "").trim(),
            qtd:
              item?.qtd != null && !Number.isNaN(Number(item.qtd))
                ? Number(item.qtd)
                : item?.quantidade != null &&
                    !Number.isNaN(Number(item.quantidade))
                  ? Number(item.quantidade)
                  : 1,
            unidade: String(item?.unidade || "UN").trim(),
            preco_un:
              item?.preco_un != null && !Number.isNaN(Number(item.preco_un))
                ? Number(item.preco_un)
                : item?.preco != null && !Number.isNaN(Number(item.preco))
                  ? Number(item.preco)
                  : item?.valor_unitario != null &&
                      !Number.isNaN(Number(item.valor_unitario))
                    ? Number(item.valor_unitario)
                    : 0,
            total_item:
              item?.total_item != null &&
              !Number.isNaN(Number(item.total_item))
                ? Number(item.total_item)
                : null,
          }))
          .filter((item: any) => item.produto)
      : [];

    return jsonResponse({
      data: {
        fornecedor:
          typeof parsed?.fornecedor === "string"
            ? parsed.fornecedor.trim()
            : null,
        cnpj: typeof parsed?.cnpj === "string" ? parsed.cnpj.trim() : null,
        total:
          parsed?.total != null && !Number.isNaN(Number(parsed.total))
            ? Number(parsed.total)
            : null,
        itens,
        numero_nota:
          parsed?.numero_nota != null ? String(parsed.numero_nota).trim() : null,
        serie: parsed?.serie != null ? String(parsed.serie).trim() : null,
        emissao: parsed?.emissao != null ? String(parsed.emissao).trim() : null,
        chave_acesso:
          parsed?.chave_acesso != null
            ? String(parsed.chave_acesso).trim()
            : null,
      },
    });
  } catch (error: unknown) {
    return errorResponse("Falha ao ler link", 500, {
      message: getErrorMessage(error, "Erro interno"),
    });
  }
}
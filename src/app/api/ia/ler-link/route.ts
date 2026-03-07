import { getGeminiModel, jsonResponse, errorResponse } from "@/lib/gemini";

type LinkBody = {
  url?: string;
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

  // Caso venha em bloco ```json ... ```
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1]);
  }

  // Caso venha texto antes/depois do JSON
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(sliced);
  }

  // Fallback direto
  return JSON.parse(text);
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/\u0000/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .trim();
}

function looksBlockedOrInvalid(html: string): boolean {
  const lower = html.toLowerCase();

  return (
    lower.includes("captcha") ||
    lower.includes("access denied") ||
    lower.includes("forbidden") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("cloudflare") ||
    lower.includes("incapsula") ||
    lower.includes("bot detection") ||
    lower.includes("erro 403") ||
    lower.includes("erro 404") ||
    lower.includes("não autorizado") ||
    lower.includes("pagina não encontrada") ||
    html.length < 200
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let htmlRes: Response;
    try {
      htmlRes = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: url,
        },
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);

      if (err?.name === "AbortError") {
        return errorResponse("Tempo esgotado ao acessar o link.", 408);
      }

      return errorResponse("Não consegui acessar o link informado.", 400, {
        message: err?.message || null,
      });
    }

    clearTimeout(timeout);

    if (!htmlRes.ok) {
      return errorResponse("Não consegui acessar o link (bloqueado ou inválido).", 400, {
        status: htmlRes.status,
        statusText: htmlRes.statusText,
      });
    }

    const contentType = htmlRes.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return errorResponse("O link não retornou uma página HTML válida.", 400, {
        contentType,
      });
    }

    const htmlRaw = await htmlRes.text();
    const html = sanitizeHtml(htmlRaw);

    if (looksBlockedOrInvalid(html)) {
      return errorResponse(
        "O site retornou uma página bloqueada, incompleta ou inválida para leitura automática.",
        400
      );
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
  ]
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

    const safeResponse = {
      fornecedor:
        typeof parsed?.fornecedor === "string" && parsed.fornecedor.trim()
          ? parsed.fornecedor.trim()
          : null,
      cnpj:
        typeof parsed?.cnpj === "string" && parsed.cnpj.trim()
          ? parsed.cnpj.trim()
          : null,
      total:
        typeof parsed?.total === "number"
          ? parsed.total
          : parsed?.total != null && !Number.isNaN(Number(parsed.total))
          ? Number(parsed.total)
          : null,
      itens: Array.isArray(parsed?.itens)
        ? parsed.itens.map((item: any) => ({
            produto:
              typeof item?.produto === "string" && item.produto.trim()
                ? item.produto.trim()
                : "",
            qtd:
              item?.qtd != null && !Number.isNaN(Number(item.qtd))
                ? Number(item.qtd)
                : 1,
            unidade:
              typeof item?.unidade === "string" && item.unidade.trim()
                ? item.unidade.trim()
                : "un",
            preco_un:
              item?.preco_un != null && !Number.isNaN(Number(item.preco_un))
                ? Number(item.preco_un)
                : 0,
            total_item:
              item?.total_item != null && !Number.isNaN(Number(item.total_item))
                ? Number(item.total_item)
                : null,
          }))
        : [],
    };

    return jsonResponse({ data: safeResponse });
  } catch (e: any) {
    return errorResponse("Falha ao ler link", 500, {
      message: e?.message || null,
    });
  }
}
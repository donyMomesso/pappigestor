import { getGeminiModel, jsonResponse, errorResponse } from "@/lib/gemini";

export const runtime = "nodejs";

type ExtrairApenas = "chave_acesso" | "dados_basicos" | null;

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  throw new Error("Resposta JSON inválida do modelo");
}

async function fileFromRemote(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 PappiGestor/1.0",
      Accept: "image/*,application/pdf,*/*",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Falha ao baixar arquivo remoto (${res.status})`);
  }

  const mimeType = res.headers.get("content-type") || "application/octet-stream";
  const bytes = await res.arrayBuffer();
  return { mimeType, base64: Buffer.from(bytes).toString("base64") };
}

function buildPrompt(extrairApenas: ExtrairApenas) {
  if (extrairApenas === "chave_acesso") {
    return `
Analise a nota fiscal/cupom e retorne APENAS JSON válido, sem markdown.
Schema:
{
  "dados": {
    "chave_acesso": string | null
  }
}
Regras:
- Nunca invente números.
- A chave de acesso deve ter 44 dígitos quando encontrada.
- Se não encontrar, use null.
`.trim();
  }

  return `
Analise esta nota fiscal, cupom, NFC-e ou imagem de documento fiscal.
Retorne APENAS JSON válido, sem markdown, no schema:
{
  "fornecedor": string | null,
  "cnpj": string | null,
  "data": string | null,
  "valor_total": number | null,
  "categoria_sugerida": string | null,
  "itens": [
    {
      "produto": string,
      "quantidade": number,
      "unidade": string,
      "valor_unitario": number | null,
      "valor_total": number | null
    }
  ],
  "dados": {
    "numero_nota": string | null,
    "data_emissao": string | null,
    "chave_acesso": string | null,
    "valor_total": number | null,
    "fornecedor": string | null,
    "cnpj": string | null
  }
}
Regras:
- Não invente. Quando não souber, use null.
- Normalizar unidade para: un, kg, g, L, ml, cx, pct, fd.
- data/data_emissao deve sair em YYYY-MM-DD quando possível.
- categoria_sugerida deve ser uma entre: Mercado, Insumos, Embalagens, Bebidas, Limpeza, Outros.
`.trim();
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let file: File | null = null;
    let imageUrl = "";
    let extrairApenas: ExtrairApenas = null;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      imageUrl = String(body?.image_url || body?.url || "").trim();
      extrairApenas = (body?.extrair_apenas as ExtrairApenas) || null;
    } else {
      const form = await req.formData();
      file = (form.get("file") || form.get("arquivo")) as File | null;
      imageUrl = String(form.get("image_url") || form.get("url") || "").trim();
      extrairApenas = (form.get("extrair_apenas") as ExtrairApenas) || null;
    }

    let mimeType = "";
    let base64 = "";

    if (file) {
      mimeType = file.type || "application/octet-stream";
      const bytes = await file.arrayBuffer();
      base64 = Buffer.from(bytes).toString("base64");
    } else if (imageUrl) {
      const remote = await fileFromRemote(imageUrl);
      mimeType = remote.mimeType;
      base64 = remote.base64;
    } else {
      return errorResponse("Arquivo ou image_url não enviado", 400);
    }

    const model = getGeminiModel("gemini-2.5-flash");
    const result = await model.generateContent([
      { text: buildPrompt(extrairApenas) },
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const raw = result.response.text();
    const parsed = JSON.parse(extractJsonObject(raw));

    if (!parsed.dados) {
      parsed.dados = {
        numero_nota: parsed.numero_nota ?? null,
        data_emissao: parsed.data ?? null,
        chave_acesso: parsed.chave_acesso ?? null,
        valor_total: parsed.valor_total ?? null,
        fornecedor: parsed.fornecedor ?? null,
        cnpj: parsed.cnpj ?? null,
      };
    }

    if (extrairApenas === "chave_acesso") {
      return jsonResponse({ dados: { chave_acesso: parsed?.dados?.chave_acesso ?? null } });
    }

    return jsonResponse({
      fornecedor: parsed.fornecedor ?? parsed?.dados?.fornecedor ?? null,
      cnpj: parsed.cnpj ?? parsed?.dados?.cnpj ?? null,
      data: parsed.data ?? parsed?.dados?.data_emissao ?? null,
      valor_total: parsed.valor_total ?? parsed?.dados?.valor_total ?? null,
      categoria_sugerida: parsed.categoria_sugerida ?? "Mercado",
      itens: Array.isArray(parsed.itens) ? parsed.itens : [],
      dados: parsed.dados,
    });
  } catch (e: any) {
    return errorResponse("Falha ao ler nota", 500, { message: e?.message });
  }
}

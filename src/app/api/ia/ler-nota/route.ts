import { getGeminiModel, jsonResponse, errorResponse } from "@/lib/gemini";

export const runtime = "nodejs"; // garante Buffer/FormData

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return errorResponse("Arquivo não enviado (field: file)", 400);

    // PDF (por enquanto sem 500)
    if (file.type === "application/pdf") {
      return errorResponse(
        "Leitura de PDF ainda não habilitada neste servidor. Envie imagem (foto) ou cole o link/QR da nota.",
        400
      );
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse("Envie uma imagem (jpg/png/webp) ou PDF.", 400);
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const model = getGeminiModel("gemini-2.5-flash");

    const prompt = `
Você vai ler uma foto de nota/cupom fiscal e extrair:
{
  "fornecedor": string | null,
  "total": number | null,
  "itens": [
    { "produto": string, "qtd": number, "unidade": string, "valor_unitario": number | null, "valor_total": number | null }
  ]
}

Regras:
- Não invente. Se não achar, use null.
- Normalizar unidade: un, kg, g, L, ml, cx, pct, fd.
- Retorne APENAS JSON válido.
`.trim();

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ]);

    const raw = result.response.text().trim();
    const jsonText = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText);

    return jsonResponse(parsed);
  } catch (e: any) {
    return errorResponse("Falha ao ler nota (imagem)", 500, { message: e?.message });
  }
  const prompt = `
      Analise esta nota fiscal/cupom de compra de um restaurante/food service.
      Extraia os dados e retorne APENAS um JSON estrito (sem markdown):
      {
        "fornecedor": "Nome do Fornecedor",
        "cnpj": "00.000.000/0000-00", 
        "total": 123.45,
        "itens": [
          {"produto": "Nome", "qtd": 1, "preco_un": 10.00}
        ]
      }
    `;
}

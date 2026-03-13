import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

function extractJson(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Resposta inválida do modelo");
  return JSON.parse(raw.slice(start, end + 1));
}

function parseChave(url: string) {
  try {
    const u = new URL(url);
    const p = u.searchParams.get("p") || "";
    const chunks = p.split("|");
    const chave = chunks[0]?.replace(/\D/g, "") || "";
    return chave.length >= 44 ? chave.slice(0, 44) : null;
  } catch {
    return null;
  }
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Falha ao consultar NFC-e (${res.status})`);
  return await res.text();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const nfceUrl = String(url || "").trim();

    if (!nfceUrl) {
      return NextResponse.json({ error: "URL da NFC-e não enviada" }, { status: 400 });
    }

    const html = await fetchHtml(nfceUrl);
    const chave = parseChave(nfceUrl);

    const model = getGeminiModel("gemini-2.5-flash");
    const prompt = `
Você receberá o HTML bruto de uma página pública de NFC-e/NF-e.
Extraia APENAS JSON válido, sem markdown, neste schema:
{
  "dados": {
    "emitente": {
      "razao_social": string,
      "nome_fantasia": string | null,
      "cnpj": string | null,
      "endereco": string | null
    },
    "itens": [
      {
        "codigo": string | null,
        "descricao": string,
        "quantidade": number,
        "unidade": string,
        "valor_unitario": number,
        "valor_total": number
      }
    ],
    "totais": {
      "subtotal": number,
      "desconto": number,
      "acrescimo": number,
      "total": number
    },
    "pagamento": {
      "forma": string | null,
      "valor_pago": number,
      "troco": number
    },
    "dados_nfce": {
      "numero": string | null,
      "serie": string | null,
      "data_emissao": string | null,
      "chave_acesso": string | null
    }
  }
}
Regras:
- Use null quando não localizar.
- quantidade, valor_unitario e valor_total devem ser números.
- unidade deve ser curta como UN, KG, G, L, ML, CX, PCT, FD.
- data_emissao em YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD quando possível.
- Nunca invente itens ausentes.
HTML:
${html.slice(0, 120000)}
`.trim();

    const result = await model.generateContent(prompt);
    const parsed = extractJson(result.response.text());

    if (chave && !parsed?.dados?.dados_nfce?.chave_acesso) {
      parsed.dados.dados_nfce.chave_acesso = chave;
    }

    if (!parsed?.dados?.itens?.length) {
      return NextResponse.json(
        {
          error: "Não foi possível extrair os itens da NFC-e automaticamente.",
          sugestao: "Tente a leitura assistida ou envie uma foto/screenshot do cupom.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message || "Erro ao ler NFC-e",
        sugestao: "Se a SEFAZ bloquear a leitura direta, use a opção de foto do cupom.",
      },
      { status: 422 }
    );
  }
}

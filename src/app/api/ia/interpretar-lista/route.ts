import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseLine(line: string) {
  const cleaned = line
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  // Patterns:
  // "Mussarela 5kg" | "Calabresa 4 cx" | "Fubá 2 kg"
  const m = cleaned.match(/^(.*?)(?:\s+)(\d+(?:[\.,]\d+)?)\s*([a-zA-Z]{1,4})?$/);
  if (m) {
    const produto = m[1].trim();
    const quantidade = Number(String(m[2]).replace(",", "."));
    const unidade = (m[3] || "un").toLowerCase();
    return { produto, quantidade: Number.isFinite(quantidade) ? quantidade : 1, unidade };
  }

  // Fallback: no quantity
  return { produto: cleaned, quantidade: 1, unidade: "un" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const texto = String(body?.texto || "");
    const lines = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const itens = lines
      .map(parseLine)
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((x: any) => ({
        produto: x.produto,
        quantidade: x.quantidade || 1,
        unidade: x.unidade || "un",
      }));

    return NextResponse.json({ itens });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

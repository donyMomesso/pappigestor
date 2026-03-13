import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const response = await fetch(new URL("/api/nfce/ler-direto", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message || "Erro ao ler NFC-e",
        sugestao: "Use uma foto do cupom ou confira se o QR Code da nota está completo.",
      },
      { status: 422 }
    );
  }
}

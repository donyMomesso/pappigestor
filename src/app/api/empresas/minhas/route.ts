import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const WORKER_URL = process.env.WORKER_URL; // ex: https://api-pappigestor.workers.dev
    if (!WORKER_URL) {
      return NextResponse.json({ error: "WORKER_URL não configurada" }, { status: 500 });
    }

    const r = await fetch(`${WORKER_URL}/api/empresas/minhas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Falha no proxy", details: e?.message }, { status: 500 });
  }
}

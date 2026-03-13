import { NextResponse } from "next/server";
import { getDb, getPizzariaId } from "../_db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const pId = getPizzariaId(new Headers(req.headers));
    const db = getDb(pId);
    return NextResponse.json(db.fornecedores);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}

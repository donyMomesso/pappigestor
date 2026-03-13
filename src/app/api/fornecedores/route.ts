import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../_db";
import { normalizeId, resolveEmpresaId, trySelectByEmpresa } from "@/lib/pappi-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const empresaId = await resolveEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const result = await trySelectByEmpresa("fornecedores", "*", empresaId);
    if (!result.error) {
      const rows = (result.data || []).map((row: any) => ({
        ...row,
        id: normalizeId(row.id),
      }));
      return NextResponse.json(rows);
    }

    const db = getDb(empresaId);
    return NextResponse.json(db.fornecedores.map((row) => ({ ...row, id: normalizeId(row.id) })));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 400 });
  }
}
